#!/usr/bin/env python3
"""Install one operator-approved Cursor CLI archive.

Started only as agentd-cli-install@cursor_<version>.service. The administration
helper can only name an approval id. This job re-verifies the approval and
archive, extracts under /opt/cursor-agent/<version>, and atomically updates the
service-user symlink. Account profiles are never touched.
"""
import argparse,grp,json,os,pwd,shutil,subprocess,sys,tarfile,tempfile,time
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import admin_cli as cli
import update

CONFIG=Path('/etc/agentd/update.json')
OPT_ROOT=Path('/opt/cursor-agent')
STATUS='cli-install-status.json'
STAGES={
    'verifying':'Verifying the approved CLI archive',
    'installing':'Installing the Cursor agent binary',
    'linking':'Updating the managed symlink',
    'checking':'Checking the installed version',
    'succeeded':'CLI install completed',
    'failed':'CLI install did not complete',
}

def write_status(path,value):
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value,sort_keys=True)+'\n');temporary.chmod(0o600);temporary.replace(path)

def agentd_home(c):
    user=c.get('user') or 'agentd'
    return Path(pwd.getpwnam(user).pw_dir)

def extract_archive(archive,stage):
    with tarfile.open(archive,'r:gz') as tar:
        try:tar.extractall(stage,filter='data')
        except TypeError:tar.extractall(stage)

def install(key,config_path=CONFIG,releases=cli.RELEASES,owner=0):
    c=update.config(update.canonical(str(config_path)))
    deployment=Path(c['deployment'])
    started=datetime.now(timezone.utc).isoformat()
    state={'stage':'verifying'}
    log=deployment/('cli-install-'+time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'.log')
    def status(stage,result='running',**extra):
        state['stage']=stage
        write_status(deployment/STATUS,{
            'format':1,'id':key,'stage':stage,'state':result,'message':STAGES[stage],
            'startedAt':started,'updatedAt':datetime.now(timezone.utc).isoformat(),**extra,
        })
    status('verifying')
    try:
        meta,archive=cli.approved(key,releases,owner)
        version=meta['version']
        if any(deployment.glob('*pending.json')):raise ValueError('Resolve pending recovery first')
        update.control_idle(c)
        installed=json.loads((deployment/'installed.json').read_text())
        update.idle(Path(c['state']),installed['release']['taskSchemaVersion'])
        status('installing')
        OPT_ROOT.mkdir(mode=0o755,exist_ok=True)
        if OPT_ROOT.is_symlink() or OPT_ROOT.lstat().st_uid!=0:
            raise ValueError('Invalid Cursor install root')
        target=OPT_ROOT/version
        if target.exists():
            raise ValueError('That Cursor version is already installed on disk')
        stage=Path(tempfile.mkdtemp(prefix='agentd-cli-',dir=str(OPT_ROOT)))
        try:
            extract_archive(archive,stage)
            extracted=stage/version
            binary=extracted/'cursor-agent'
            if not binary.is_file() or not os.access(binary,os.X_OK):
                raise ValueError('Extracted cursor-agent is not executable')
            extracted.rename(target)
            for path,_,files in os.walk(target):
                os.chown(path,0,0)
                for name in files:
                    os.chown(os.path.join(path,name),0,0)
            os.chmod(binary,0o755)
        finally:
            shutil.rmtree(stage,ignore_errors=True)
        status('linking')
        home=agentd_home(c)
        link_dir=home/'.local'/'bin'
        link_dir.mkdir(parents=True,exist_ok=True)
        link=link_dir/'cursor-agent'
        temporary=link_dir/('.cursor-agent.'+str(os.getpid())+'.tmp')
        if temporary.exists() or temporary.is_symlink():temporary.unlink()
        temporary.symlink_to(target/'cursor-agent')
        uid=pwd.getpwnam(c.get('user') or 'agentd').pw_uid
        gid=grp.getgrnam(c.get('group') or 'agentd').gr_gid
        os.chown(temporary,uid,gid,follow_symlinks=False)
        temporary.replace(link)
        status('checking')
        probe=subprocess.run(
            [str(link),'--version'],
            check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=10,
            env={'PATH':'/usr/bin:/bin','HOME':str(home),'LANG':'C','NO_OPEN_BROWSER':'1'},
            user=uid,group=gid,
        )
        reported=(probe.stdout or '').strip().splitlines()[0][:128] if (probe.stdout or '').strip() else ''
        if version not in reported and reported!=version:
            raise ValueError('Installed Cursor version did not report the approved id')
        with log.open('a') as output:
            os.chmod(log,0o600)
            output.write(f'installed {key} -> {target}\nreported {reported}\n')
        status('succeeded','succeeded',version=version,reported=reported)
    except Exception:
        status('failed','failed',failedStage=state['stage'])
        raise

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id',required=True)
    parser.add_argument('--config',default=str(CONFIG))
    a=parser.parse_args()
    try:
        if os.geteuid()!=0:raise ValueError('Administrator required')
        install(a.id,Path(a.config))
    except Exception as error:
        print(str(error),file=sys.stderr);sys.exit(1)
