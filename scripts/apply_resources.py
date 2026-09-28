#!/usr/bin/env python3
"""Install the standard service resource profile without changing sandbox policy."""
import argparse,fcntl,json,os,subprocess,sys,tempfile
from pathlib import Path
import update
from separate_gateway import atomic
PROFILE='standard-v1'
CGROUP_ROOT=Path('/sys/fs/cgroup')
PROPERTIES=['MemoryHigh','MemoryMax','MemorySwapMax','TasksMax','CPUQuotaPerSecUSec','LimitNOFILE','LimitCORE','OOMPolicy','KillMode']
EXPECTED={
 'runnerUnit':{'MemoryHigh':str(3*1024**3),'MemoryMax':str(4*1024**3),'MemorySwapMax':'0','TasksMax':'256','CPUQuotaPerSecUSec':'2s','LimitNOFILE':'4096','LimitCORE':'0','OOMPolicy':'kill','KillMode':'control-group'},
 'mobileUnit':{'MemoryHigh':str(384*1024**2),'MemoryMax':str(512*1024**2),'MemorySwapMax':'0','TasksMax':'64','CPUQuotaPerSecUSec':'500ms','LimitNOFILE':'1024','LimitCORE':'0','OOMPolicy':'kill','KillMode':'control-group'}}

def properties(c,key):return dict(line.split('=',1) for line in update.capture(['systemctl','show',c[key],*['--property='+x for x in PROPERTIES]]).splitlines() if '=' in line)
def verify(c):
    for key,expected in EXPECTED.items():
        actual=properties(c,key)
        if any(actual.get(k)!=v for k,v in expected.items()):raise ValueError('Service resource profile mismatch: '+key)

def live_verify(c):
    for key,expected in EXPECTED.items():
        group=update.capture(['systemctl','show',c[key],'--property=ControlGroup','--value']).strip()
        if not group.startswith('/') or '..' in group.split('/'):raise ValueError('Invalid service cgroup')
        root=CGROUP_ROOT/group.lstrip('/')
        if (root/'memory.max').read_text().strip()!=expected['MemoryMax'] or (root/'pids.max').read_text().strip()!=expected['TasksMax'] or (root/'memory.swap.max').read_text().strip()!='0':raise ValueError('Kernel resource limits do not match service configuration')
        quota,period=(root/'cpu.max').read_text().split()
        if quota=='max' or int(quota)/int(period)!=(2 if key=='runnerUnit' else 0.5):raise ValueError('Kernel CPU quota does not match')

def drops(c):return [Path('/etc/systemd/system')/(c[key]+'.d')/'100-resource-limits.conf' for key in EXPECTED]
def apply(c,config_path,previous,current,backup):
    paths=drops(c)
    if any(path.exists() or path.is_symlink() for path in paths):raise ValueError('Resource override already exists; review it first')
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    new=dict(c,resourceProfile=PROFILE);journal=Path(c['deployment'])/'resources-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        update.control_idle(c);update.run(['systemctl','stop',c['mobileUnit']]);update.control_idle(c);update.idle(Path(c['state']),previous['release']['taskSchemaVersion']);update.run(['systemctl','stop',c['runnerUnit']])
        if update.inventory(c)!=current:raise ValueError('Configuration drift during resource update')
        changed=True
        for path,(key,expected) in zip(paths,EXPECTED.items()):
            text='[Service]\n'+''.join(k+'='+v+'\n' for k,v in expected.items() if k!='CPUQuotaPerSecUSec')+'CPUQuota='+('200%' if key=='runnerUnit' else '50%')+'\n'
            path.parent.mkdir(exist_ok=True,mode=0o755);atomic(path,text.encode(),0o644)
        update.run(['systemctl','daemon-reload']);target=update.inventory(new);verify(new)
        update.run(['systemctl','start',c['runnerUnit']]);update.ready(new,previous['release']);update.run(['systemctl','start',c['mobileUnit']]);update.run(['systemctl','is-active','--quiet',c['runnerUnit'],c['mobileUnit']]);live_verify(new)
        if update.inventory(new)!=target:raise ValueError('Resource profile drift during restart')
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode());atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode());journal.unlink()
        print('Service memory, CPU and process limits installed and verified against live kernel cgroups.')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            update.run(['systemctl','stop',c['mobileUnit'],c['runnerUnit']])
            for path in paths:path.unlink(missing_ok=True)
            atomic(config_path,old_config);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        update.run(['systemctl','start',c['runnerUnit'],c['mobileUnit']]);raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    path=update.canonical(a.config);c=update.config(path)
    if not c.get('gatewayUser'):raise ValueError('Separate gateway migration required first')
    if c.get('resourceProfile'):verify(c);live_verify(c);print('Service resource limits already verified.');return
    root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery before resource changes')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        if previous['release']['version']!='0.23.0':raise ValueError('Install compatible 0.23.0 application first')
        for key,desired in EXPECTED.items():
            actual=properties(c,key)
            # Existing restrictive deployments need a deliberate custom review, never an automatic relaxation.
            if actual.get('MemoryMax')!='infinity' or actual.get('CPUQuotaPerSecUSec')!='infinity' or int(actual.get('TasksMax','0'))<int(desired['TasksMax']):raise ValueError('Existing resource restrictions require a custom reviewed migration')
        backup=Path(tempfile.mkdtemp(prefix='agentd-resources-backup-',dir=Path(c['app']).parent));apply(c,path,previous,current,backup)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Resource migration failed; inspect local logs and resources-pending.json.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
