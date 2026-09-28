#!/usr/bin/env python3
"""Administrator-only application updates; never change units, accounts or policy."""
import argparse
from contextlib import closing
import fcntl
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import shlex
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.request
from release import verify, extract

PROPERTIES = ['NeedDaemonReload', 'User', 'Group', 'WorkingDirectory', 'ExecStart', 'Environment', 'EnvironmentFiles', 'FragmentPath', 'DropInPaths', 'NoNewPrivileges', 'CapabilityBoundingSet', 'ProtectSystem', 'ProtectHome', 'PrivateTmp', 'ProtectKernelTunables', 'ProtectKernelModules', 'ProtectControlGroups', 'RestrictSUIDSGID', 'LockPersonality', 'RestrictAddressFamilies', 'ReadWritePaths', 'ReadOnlyPaths', 'InaccessiblePaths', 'SystemCallFilter', 'RestrictNamespaces', 'ProtectProc', 'ProcSubset']

def run(args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)

def capture(args):
    return run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout

def canonical(value):
    path = Path(value)
    if not path.is_absolute() or str(path) != value or path.resolve() != path or len(path.parts) < 3:
        raise ValueError('Use canonical absolute paths without symlinks')
    return path

def config(path):
    c = json.loads(Path(path).read_text())
    required = {'app','state','deployment','user','runnerUnit','mobileUnit','node','npm','healthUrl','configFiles','controlSocket'}
    if set(c) != required: raise ValueError('Unexpected or missing configuration field')
    paths = [canonical(c[k]) for k in ('app','state','deployment')]
    for i, a in enumerate(paths):
        if any(a == b or a in b.parents or b in a.parents for b in paths[i+1:]): raise ValueError('Application, state and deployment paths must be disjoint')
    for k in ('node','npm'): canonical(c[k]) if not Path(c[k]).is_symlink() else canonical(str(Path(c[k]).resolve()))
    canonical(c['controlSocket'])
    for path in c['configFiles']: canonical(path)
    if not re.fullmatch(r'[a-z_][a-z0-9_-]*',c['user']) or c['user'] == 'root': raise ValueError('Dedicated non-root service user required')
    for k in ('runnerUnit','mobileUnit'):
        if not re.fullmatch(r'[a-zA-Z0-9_-]+\.service',c[k]): raise ValueError('Invalid service unit')
    if c['runnerUnit'] == c['mobileUnit']: raise ValueError('Separate units required')
    if not re.fullmatch(r'http://127\.0\.0\.1:[0-9]+/healthz',c['healthUrl']): raise ValueError('Loopback health URL required')
    return c

def inventory(c):
    result = {}
    for key in ('runnerUnit','mobileUnit'):
        unit = c[key]
        text = capture(['systemctl','show',unit,*['--property='+p for p in PROPERTIES]])
        properties = dict(line.split('=',1) for line in text.splitlines() if '=' in line)
        if properties.get('NeedDaemonReload') == 'yes': raise ValueError('Reload and review changed unit files before updating')
        for name, value in {'User':c['user'],'WorkingDirectory':c['app'],'NoNewPrivileges':'yes','CapabilityBoundingSet':'','ProtectSystem':'strict','ProtectHome':'yes','PrivateTmp':'yes','ProtectKernelModules':'yes','ProtectControlGroups':'yes','RestrictSUIDSGID':'yes'}.items():
            if properties.get(name) != value: raise ValueError('Unsupported service security configuration: '+name)
        # The runner template locks personality; the gateway template does not.
        # Preserve and fingerprint either gateway setting, but never accept a
        # missing/disabled runner lock or an unknown gateway value.
        allowed_personality = ('yes',) if key == 'runnerUnit' else ('yes','no')
        if properties.get('LockPersonality') not in allowed_personality: raise ValueError('Unsupported service security configuration: '+key+' LockPersonality')
        if key == 'runnerUnit' and (properties.get('ProtectKernelTunables') != 'no' or 'AF_NETLINK' not in properties.get('RestrictAddressFamilies','').split()): raise ValueError('Unsupported worker namespace configuration')
        # Hash all selected effective properties, including Environment. Never print them.
        files = [properties.get('FragmentPath',''), *properties.get('DropInPaths','').split()]
        files.extend(re.findall(r'(\S+) \(ignore_errors=(?:yes|no)\)',properties.get('EnvironmentFiles','')))
        environment = dict(item.split('=',1) for item in shlex.split(properties.get('Environment','')) if '=' in item)
        env_files = re.findall(r'(\S+) \(ignore_errors=(?:yes|no)\)',properties.get('EnvironmentFiles',''))
        for name in env_files:
            for line in Path(name).read_text().splitlines():
                if not line.strip() or line.lstrip().startswith(('#',';')): continue
                parts=shlex.split(line,comments=False)
                if len(parts)!=1 or '=' not in parts[0]: raise ValueError('Unsupported EnvironmentFile syntax; review deployment configuration')
                env_key,value=parts[0].split('=',1); environment[env_key]=value
        entry='server.ts' if key == 'runnerUnit' else 'mobile.ts'
        if ('path='+c['node']+' ;') not in properties.get('ExecStart','') or ('argv[]='+c['node']+' '+c['app']+'/src/'+entry+' ;') not in properties.get('ExecStart',''): raise ValueError('Unsupported service entry point')
        if key=='runnerUnit':
            if environment.get('AGENTD_STATE_DIR','/srv/agentd/state')!=c['state'] or environment.get('AGENTD_CONTROL_SOCKET',str(Path(c['state'])/'control.sock'))!=c['controlSocket']: raise ValueError('Configured state/socket differs from service')
            if environment.get('AGENTD_RUNNER')!='1': raise ValueError('Task runner must be enabled')
        else:
            mobile_config=environment.get('AGENTD_MOBILE_CONFIG','/etc/agentd/mobile.json')
            if mobile_config not in c['configFiles']: raise ValueError('Include the mobile configuration in configFiles')
            mobile=json.loads(Path(mobile_config).read_text())
            # Match src/mobile.ts: absent keys use fixed application defaults;
            # explicit null/empty/different values must still fail closed.
            if mobile.get('socket','/run/agentd/control.sock')!=c['controlSocket']: raise ValueError('Mobile control socket differs from update target')
            if mobile.get('publicDir','/opt/agentd/public')!=str(Path(c['app'])/'public'): raise ValueError('Mobile public directory differs from update target')
        hashes = {}
        for name in files:
            if not name: raise ValueError('Missing unit file')
            path = canonical(name)
            hashes[str(path)] = hashlib.sha256(path.read_bytes()).hexdigest()
        # ExecStart contains transient process results on systemd. Bind the
        # configured command, never its PID, timestamps or exit status.
        properties['ExecStart'] = properties['ExecStart'].split(' ; start_time=',1)[0]
        result[unit] = {'properties':hashlib.sha256(json.dumps(properties,sort_keys=True).encode()).hexdigest(),'files':hashes}
    result['configuration'] = {name:hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in c['configFiles']}
    return result

def idle(state, maximum):
    with closing(sqlite3.connect((state/'tasks.sqlite').as_uri()+'?mode=ro',uri=True)) as db:
        version = db.execute('PRAGMA user_version').fetchone()[0]
        if version < 0 or version > maximum: raise ValueError('Database is newer than this release')
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        for table, column, states in [('tasks','status',('queued','running','cancelling')),('repository_jobs','state',('running',)),('dependency_jobs','state',('running',)),('publications','state',('preparing','publishing','pushing','branch_published','creating_pr')),('review_jobs','state',('preparing',))]:
            if table in tables and db.execute(f'SELECT 1 FROM {table} WHERE {column} IN ({",".join("?" for _ in states)}) LIMIT 1',states).fetchone():
                raise ValueError('Finish active work before updating')

def control_idle(c):
    for operation in ('account-session','github-status','operations'):
        with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as client:
            client.settimeout(10); client.connect(c['controlSocket'])
            client.sendall((json.dumps({'op':operation})+'\n').encode())
            data=b''
            while True:
                part=client.recv(65536)
                if not part: break
                data+=part
                if len(data)>2*1024*1024: raise ValueError('Unexpected control response')
        reply=json.loads(data)
        if not reply.get('ok'): raise ValueError('Cannot establish idle service state')
        value=reply['result']
        if operation=='operations':
            service=value['service']
            if any(service.get(k) for k in ('activeTask','queueDepth','accountChange','renewing','dependencySetup')): raise ValueError('Wait for current work or account changes')
        elif value.get('busy'): raise ValueError('Finish account changes before updating')

# Run with the service account but a disposable home; no candidate tests run as root.
def test_candidate(c, stage, temporary):
    account = pwd.getpwnam(c['user'])
    home = temporary/'home'; home.mkdir(); os.chown(home,account.pw_uid,account.pw_gid)
    for root, dirs, files in os.walk(stage):
        os.chown(root,account.pw_uid,account.pw_gid)
        for name in files: os.chown(Path(root)/name,account.pw_uid,account.pw_gid)
    def command(args):
        run(['systemd-run','--quiet','--wait','--pipe','--collect','--uid='+c['user'], '--gid='+str(account.pw_gid),
             '--setenv=HOME='+str(home),'--setenv=PATH='+str(Path(c['node']).parent)+':/usr/bin:/bin',
             '--property=WorkingDirectory='+str(stage), '--property=NoNewPrivileges=yes', '--property=ProtectSystem=strict',
             '--property=ProtectHome=yes','--property=PrivateTmp=yes','--property=ProtectKernelTunables=no',
             '--property=ProtectKernelModules=yes','--property=ProtectControlGroups=yes','--property=CapabilityBoundingSet=',
             '--property=RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6 AF_NETLINK',
             '--property=InaccessiblePaths='+' '.join([str(Path(c['state']).parent),account.pw_dir,str(Path(c['controlSocket']).parent),*c['configFiles']]),
             '--property=ReadWritePaths='+str(temporary), *args])
    command([c['npm'],'ci','--ignore-scripts','--no-audit','--no-fund'])
    command([c['npm'],'run','typecheck'])
    command([c['node'],'scripts/test-isolation-ci.mjs'])
    # All deployed code is immutable to the service account after validation.
    for root, dirs, files in os.walk(stage):
        os.chown(root,0,0); os.chmod(root,0o755)
        for name in files:
            path=Path(root)/name
            if not path.is_symlink():
                os.chown(path,0,0); os.chmod(path,0o755 if path.stat().st_mode & 0o111 else 0o644)

def unexpected_files(stage, files):
    # Validation may add dependencies under node_modules only. Anything else that
    # appeared in the candidate (outside the manifest) must not be deployed.
    allowed=set(files)|{'release-manifest.json'}
    for directory, dirs, names in os.walk(stage):
        for name in [*dirs, *names]:
            path=Path(directory)/name; relative=path.relative_to(stage).as_posix()
            if relative=='node_modules' or relative.startswith('node_modules/'): continue
            if path.is_symlink(): raise ValueError('Candidate contains an unexpected link: '+relative)
            if path.is_file() and relative not in allowed: raise ValueError('Candidate contains an unexpected file: '+relative)

def same_filesystem(c):
    # Rollback renames state into the backup next to the application. A rename
    # across filesystems fails midway, so refuse before anything is stopped.
    if os.stat(c['state']).st_dev != os.stat(Path(c['app']).parent).st_dev:
        raise ValueError('State and the application parent must share a filesystem for rollback')

def ready(c, manifest):
    # Ignore proxy environment and refuse redirects away from the fixed loopback URL.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs): return None
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    for _ in range(60):
        try:
            with opener.open(c['healthUrl'],timeout=1) as response: value=json.load(response)
            if value.get('status')=='ok' and value.get('version')==manifest['version'] and value.get('taskSchemaVersion')==manifest['taskSchemaVersion']: return
        except (OSError,ValueError): pass
        time.sleep(0.5)
    raise ValueError('New service did not become ready with the expected version and schema')

def copy_state(source, destination):
    shutil.copytree(source,destination,symlinks=True)
    # copytree preserves modes/times, not ownership. Preserve ownership on both
    # backup and restoration so the unprivileged service can reopen its state.
    for directory, dirs, files in os.walk(source,followlinks=False):
        for name in ['.', *dirs, *files]:
            original=Path(directory)/name
            target=destination/original.relative_to(source)
            info=original.lstat()
            os.chown(target,info.st_uid,info.st_gid,follow_symlinks=False)

def apply(c, manifest, stage, previous, current, backup):
    app,state=Path(c['app']),Path(c['state'])
    runner,mobile=c['runnerUnit'],c['mobileUnit']
    swapped=False
    control_idle(c)
    try:
        run(['systemctl','stop',mobile])
        control_idle(c)
        idle(state,manifest['taskSchemaVersion'])
        # Stop the daemon to close all writers, then recheck durable jobs.
        run(['systemctl','stop',runner])
        idle(state,manifest['taskSchemaVersion'])
        if inventory(c) != current: raise ValueError('Configuration changed while preparing update')
        copy_state(state,backup/'state')
        app.rename(backup/'app')
        try: stage.rename(app)
        except BaseException: (backup/'app').rename(app); raise
        swapped=True
        run(['systemctl','start',runner]); ready(c,manifest)
        run(['systemctl','start',mobile]); run(['systemctl','is-active','--quiet',runner,mobile])
        record={'release':manifest,'configuration':current}
        if inventory(c) != current: raise ValueError('Configuration changed during service restart')
        target=Path(c['deployment'])/'installed.json'
        temporary=target.with_suffix('.tmp'); temporary.write_text(json.dumps(record,sort_keys=True,indent=2)+'\n'); temporary.chmod(0o600); temporary.replace(target)
    except BaseException:
        if swapped:
            run(['systemctl','stop',mobile,runner])
            app.rename(backup/'failed-app'); (backup/'app').rename(app)
            state.rename(backup/'failed-state'); copy_state(backup/'state',state)
        # Old app and matching state, with native profiles/journals outside state untouched.
        run(['systemctl','start',runner,mobile])
        raise

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['plan','install']); parser.add_argument('--config',required=True)
    parser.add_argument('--archive',required=True); parser.add_argument('--sha256',required=True)
    parser.add_argument('--adopt-existing',action='store_true',help='Explicitly record existing configuration on first managed update')
    args=parser.parse_args()
    try:
        c=config(args.config); manifest,files=verify(args.archive,args.sha256)
        if os.geteuid()!=0: raise ValueError('Run as administrator to inspect protected deployment configuration')
        root=Path(c['deployment']); root.mkdir(mode=0o700,exist_ok=True)
        if root.is_symlink() or root.stat().st_uid!=0 or root.stat().st_mode & 0o077: raise ValueError('Deployment directory must be root-owned mode 700')
        with (root/'update.lock').open('w') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            if (root/'pending.json').exists(): raise ValueError('An interrupted update requires administrator recovery; see pending.json')
            current=inventory(c); record=root/'installed.json'
            previous=json.loads(record.read_text()) if record.exists() else None
            if previous and previous['configuration']!=current: raise ValueError('Installed configuration drifted; review and reconcile it before updating')
            if not previous and not args.adopt_existing: raise ValueError('First managed update requires --adopt-existing after configuration review')
            same_filesystem(c)
            idle(Path(c['state']),manifest['taskSchemaVersion'])
            for unit in (c['runnerUnit'],c['mobileUnit']): run(['systemctl','is-active','--quiet',unit])
            print(json.dumps({'version':manifest['version'],'revision':manifest['revision'],'taskSchemaVersion':manifest['taskSchemaVersion'],'configuration':'unchanged' if previous else 'adopt existing'}),flush=True)
            if args.command=='install':
                # Same filesystem as app for atomic renames. Private backup is not exposed to workers.
                backup=Path(tempfile.mkdtemp(prefix='agentd-backup-',dir=Path(c['app']).parent))
                temporary=Path(tempfile.mkdtemp(prefix='agentd-validation-',dir=Path(c['app']).parent)); temporary.chmod(0o755)
                try:
                    stage=temporary/'app'; extract(files,manifest,stage)
                    test_candidate(c,stage,temporary)
                    # Source files must still match after validation; npm may only add dependencies.
                    for name,data in files.items():
                        if (stage/name).is_symlink() or (stage/name).read_bytes()!=data: raise ValueError('Candidate changed during validation')
                    unexpected_files(stage,files)
                    journal=root/'pending.json'
                    journal.write_text(json.dumps({'backup':str(backup),'version':manifest['version']})+'\n'); journal.chmod(0o600)
                    try:
                        apply(c,manifest,stage,previous,current,backup)
                    except BaseException:
                        # Preserve the journal even after rollback; inspect before retrying.
                        print('Inspect the backup and pending.json before another update.',file=sys.stderr)
                        raise
                    journal.unlink()
                    print('Application update complete. Backup: '+str(backup))
                    print('Units, configuration, project checkouts and native account profiles were preserved.')
                finally: shutil.rmtree(temporary)
    except Exception as error:
        # Subprocess arguments/output and configuration values can contain private data.
        if isinstance(error,subprocess.CalledProcessError): print('Deployment command failed; inspect local service logs.',file=sys.stderr)
        else: print(str(error),file=sys.stderr)
        sys.exit(1)
