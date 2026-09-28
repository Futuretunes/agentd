#!/usr/bin/env python3
"""Explicit one-time identity migration after installing the compatible 0.22 application.
Ordinary update.py never changes units or accounts. This migration preserves its
old drift baseline, stops the gateway before changes and restores the prior
identity/configuration on any failed acceptance check. Never restores credentials.
"""
import argparse, fcntl, grp, json, os, pwd, shutil, subprocess, sys, tempfile
from pathlib import Path
import update

WEB='agentd-web'
WEB_CONFIG=Path('/etc/agentd-web')
SOCKET='/run/agentd-web/gateway.sock'
DROP='99-gateway-boundary.conf'

def atomic(path, data, mode=0o600):
    temporary=path.with_suffix('.gateway-tmp');temporary.write_bytes(data);temporary.chmod(mode);temporary.replace(path)

def layout(c):
    expected={'app':'/opt/agentd','state':'/srv/agentd/state','user':'agentd','runnerUnit':'agentd.service','mobileUnit':'agentd-mobile.service','controlSocket':'/run/agentd/control.sock'}
    if any(c.get(k)!=v for k,v in expected.items()):raise ValueError('This migration supports the standard managed layout only')
    if c['configFiles'][0]!='/etc/agentd/mobile.json':raise ValueError('Unexpected mobile configuration')
    if pwd.getpwnam(c['user']).pw_dir!='/var/lib/agentd':raise ValueError('Unexpected runner home')

def identity():
    try: account=pwd.getpwnam(WEB)
    except KeyError:
        try:grp.getgrnam(WEB)
        except KeyError:update.run(['groupadd','--system',WEB])
        update.run(['useradd','--system','--gid',WEB,'--home-dir','/nonexistent','--no-create-home','--shell','/usr/sbin/nologin',WEB]);account=pwd.getpwnam(WEB)
    if account.pw_uid==0 or account.pw_gid!=grp.getgrnam(WEB).gr_gid or account.pw_shell!='/usr/sbin/nologin' or account.pw_dir!='/nonexistent':raise ValueError('Existing gateway account does not match dedicated identity')
    if set(grp.getgrnam(WEB).gr_mem)-{WEB}:raise ValueError('Gateway group has unrelated members')
    if set(os.getgrouplist(WEB,account.pw_gid))!={account.pw_gid}:raise ValueError('Gateway account has unrelated groups')
    return account

def drop_paths(c):
    return [Path('/etc/systemd/system')/(c[k]+'.d')/DROP for k in ('runnerUnit','mobileUnit')]

def change(c, config_path, previous, current, backup):
    account=identity()
    mobile_path=Path(c['configFiles'][0])
    if str(mobile_path) not in c['configFiles']:raise ValueError('Expected mobile configuration missing')
    mobile=json.loads(mobile_path.read_text())
    # Do not move or expose runner configuration. Copy only the browser's TLS key,
    # certificate and access-hash configuration into a new root-owned directory.
    for field in ('key','cert'):
        source=update.canonical(mobile[field]);info=source.stat()
        if not source.is_file() or info.st_size>65536:raise ValueError('Invalid TLS file')
    drops=drop_paths(c)
    if WEB_CONFIG.exists() or WEB_CONFIG.is_symlink() or any(p.exists() or p.is_symlink() for p in drops):raise ValueError('Gateway migration paths already exist; review before retrying')
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    new=dict(c,gatewayUser=WEB,gatewaySocket=SOCKET)
    new['configFiles']=[*c['configFiles'],str(WEB_CONFIG/'mobile.json'),str(WEB_CONFIG/'tls.key'),str(WEB_CONFIG/'tls.crt')]
    journal=Path(c['deployment'])/'gateway-pending.json'
    atomic(journal,json.dumps({'backup':str(backup),'phase':'prepared'}).encode())
    changed=False
    try:
        update.control_idle(c);update.run(['systemctl','stop',c['mobileUnit']]);update.control_idle(c)
        update.idle(Path(c['state']),previous['release']['taskSchemaVersion'])
        update.run(['systemctl','stop',c['runnerUnit']])
        if update.inventory(c)!=current:raise ValueError('Configuration changed during gateway migration')
        changed=True
        WEB_CONFIG.mkdir(mode=0o750);WEB_CONFIG.chmod(0o750);os.chown(WEB_CONFIG,0,account.pw_gid)
        for field,name in [('key','tls.key'),('cert','tls.crt')]:
            target=WEB_CONFIG/name;target.write_bytes(Path(mobile[field]).read_bytes());target.chmod(0o640);os.chown(target,0,account.pw_gid);mobile[field]=str(target)
        mobile.pop('attachments',None);mobile['socket']=SOCKET
        target=WEB_CONFIG/'mobile.json';target.write_text(json.dumps(mobile)+'\n');target.chmod(0o640);os.chown(target,0,account.pw_gid)
        runner='[Service]\nSupplementaryGroups=agentd-web\nRuntimeDirectory=agentd agentd-web\nEnvironment=AGENTD_GATEWAY_SOCKET='+SOCKET+'\nEnvironment=AGENTD_GATEWAY_GID='+str(account.pw_gid)+'\n'
        gateway='[Service]\nUser=agentd-web\nGroup=agentd-web\nSupplementaryGroups=\nEnvironment=AGENTD_MOBILE_CONFIG=/etc/agentd-web/mobile.json\nReadWritePaths=\nInaccessiblePaths=/srv/agentd /var/lib/agentd /run/agentd /etc/agentd\nPrivateDevices=yes\n'
        for path,data in zip(drops,[runner,gateway]):path.parent.mkdir(mode=0o755,exist_ok=True);atomic(path,data.encode(),0o644)
        update.run(['systemctl','daemon-reload'])
        # Validate exact target policy before starting either service.
        target_inventory=update.inventory(new)
        update.run(['systemctl','start',c['runnerUnit']]);update.ready(new,previous['release'])
        update.run(['systemctl','start',c['mobileUnit']]);update.run(['systemctl','is-active','--quiet',c['runnerUnit'],c['mobileUnit']])
        pid=update.capture(['systemctl','show',c['mobileUnit'],'--property=MainPID','--value']).strip()
        if not pid.isdigit() or int(pid)<1:raise ValueError('Gateway process missing')
        update.run(['nsenter','--target',pid,'--mount','--','runuser','-u',WEB,'--','/usr/bin/python3','-B',c['app']+'/scripts/gateway_probe.py',str(WEB_CONFIG/'mobile.json'),c['controlSocket'],'/srv/agentd','/var/lib/agentd','/run/agentd','/etc/agentd'])
        if update.inventory(new)!=target_inventory:raise ValueError('Gateway configuration changed during verification')
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode())
        atomic(record,(json.dumps(dict(previous,configuration=target_inventory),indent=2)+'\n').encode())
        journal.unlink()
        print('Separate web gateway installed and its live file/socket boundary verified.')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            update.run(['systemctl','stop',c['mobileUnit'],c['runnerUnit']])
            for path in drops:path.unlink(missing_ok=True)
            shutil.rmtree(WEB_CONFIG)
            atomic(config_path,old_config);atomic(record,old_record)
            update.run(['systemctl','daemon-reload'])
        update.run(['systemctl','start',c['runnerUnit'],c['mobileUnit']])
        # Keep the transaction marker for explicit review; no blind retry.
        print('Gateway migration failed; prior identity/configuration restored. Review gateway-pending.json.',file=sys.stderr)
        raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);args=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required for service identity migration')
    config_path=update.canonical(args.config);c=update.config(config_path);layout(c)
    if c.get('gatewayUser'):raise ValueError('Gateway separation is already configured')
    root=Path(c['deployment']);info=root.stat()
    if root.is_symlink() or info.st_uid!=0 or info.st_mode&0o077:raise ValueError('Invalid managed deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any((root/name).exists() for name in ('pending.json','gateway-pending.json')):raise ValueError('Resolve pending deployment transaction first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Managed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or installed['version']!='0.22.0':raise ValueError('Install the compatible managed 0.22.0 application first')
        backup=Path(tempfile.mkdtemp(prefix='agentd-gateway-backup-',dir=Path(c['app']).parent))
        change(c,config_path,previous,current,backup)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Gateway migration command failed; inspect local service logs.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
