#!/usr/bin/env python3
"""Install one operator-approved release. Started only as agentd-update@<version>.service.

The web gateway and the administration helper can only name a version. This job
re-verifies the approval record and archive, refuses anything not newer than the
installed release, then runs the release's own managed updater (plan, tests, backup,
swap, readiness, rollback) and the installed verification steps. Progress is written
to a root-only status file with fixed, non-sensitive messages; full output goes to a
root-only log.
"""
import argparse,json,os,re,shutil,stat,subprocess,sys,tempfile,time
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import release,update

RELEASES=Path('/var/lib/agentd-releases')
VERSION=re.compile(r'[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}')
STATUS='update-status.json'
# Fixed user-facing descriptions; never subprocess output or paths.
STAGES={'verifying':'Verifying the approved release','planning':'Checking configuration and idle state',
 'installing':'Running tests, backing up and installing','restoring':'Restoring the previous version and its data','verifying_services':'Verifying services after the update',
 'succeeded':'Update installed','failed':'Update did not complete'}

def version_key(value):
    if not isinstance(value,str) or not VERSION.fullmatch(value):raise ValueError('Invalid version')
    return tuple(int(part) for part in value.split('.'))

def root_file(path,owner=0):
    info=path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid!=owner or info.st_mode&0o022:
        raise ValueError('Approved release files must be root-owned regular files')

def approved(version,releases=RELEASES,owner=0):
    version_key(version)
    record,archive=releases/(version+'.json'),releases/(version+'.tar.gz')
    root_file(record,owner);root_file(archive,owner)
    meta=json.loads(record.read_text())
    if meta.get('format')!=1 or meta.get('version')!=version or not re.fullmatch(r'[0-9a-f]{64}',str(meta.get('sha256',''))):
        raise ValueError('Invalid approval record')
    manifest,files=release.verify(archive,meta['sha256'])
    if manifest['version']!=version or manifest['revision']!=meta.get('revision'):
        raise ValueError('Approval record does not match its archive')
    return meta,archive,manifest,files

def write_status(path,value):
    temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(value,sort_keys=True)+'\n');temporary.chmod(0o600);temporary.replace(path)

def run(version,config_path,releases=RELEASES,runner=subprocess.run,owner=0):
    c=update.config(update.canonical(config_path));deployment=Path(c['deployment'])
    started=datetime.now(timezone.utc).isoformat();state={'stage':'verifying'}
    log=deployment/('update-'+time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'.log')
    def status(stage,result='running',**extra):
        state['stage']=stage
        write_status(deployment/STATUS,{'format':1,'version':version,'stage':stage,'state':result,'message':STAGES[stage],
          'startedAt':started,'updatedAt':datetime.now(timezone.utc).isoformat(),**extra})
    status('verifying')
    try:
        meta,archive,manifest,files=approved(version,releases,owner)
        installed=json.loads((deployment/'installed.json').read_text())['release']
        if version_key(version)<=version_key(installed['version']):raise ValueError('Only a newer approved release can be installed')
        stage=Path(tempfile.mkdtemp(prefix='agentd-update-',dir=deployment))
        try:
            release.extract(files,manifest,stage/'source')
            updater=str(stage/'source/scripts/update.py')
            with log.open('a') as output:
                os.chmod(log,0o600)
                def step(*args):
                    runner(['/usr/bin/python3','-B',*args],stdout=output,stderr=subprocess.STDOUT,check=True)
                common=['--config',config_path,'--archive',str(archive),'--sha256',meta['sha256']]
                status('planning');step(updater,'plan',*common)
                status('installing');step(updater,'install',*common)
                status('verifying_services')
                current=update.config(update.canonical(config_path))
                for flag,script in (('resourceProfile','apply_resources.py'),('gatewayHardening','apply_gateway_hardening.py'),('adminUnit','apply_diagnostics.py')):
                    if current.get(flag):step(str(Path(current['app'])/'scripts'/script),'--config',config_path)
                # Install job units a release introduces (for example rollback); a no-op
                # verification when they already exist.
                if current.get('adminUnit') and (Path(current['app'])/'scripts/apply_updates.py').exists():
                    step(str(Path(current['app'])/'scripts/apply_updates.py'),'--config',config_path)
        finally:shutil.rmtree(stage,ignore_errors=True)
        status('succeeded','succeeded',revision=manifest['revision'][:12])
    except Exception:
        # The managed updater restores the previous application and state on its own
        # failures; this status only reports where the job stopped.
        status('failed','failed',failedStage=state['stage'])
        raise

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version',required=True);parser.add_argument('--config',default='/etc/agentd/update.json');a=parser.parse_args()
    try:
        if os.geteuid()!=0:raise ValueError('Administrator required')
        run(a.version,a.config)
    except Exception as error:
        print('Approved update failed; see the update log in the deployment directory.' if isinstance(error,subprocess.CalledProcessError) else str(error),file=sys.stderr)
        sys.exit(1)
