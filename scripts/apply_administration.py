#!/usr/bin/env python3
"""Install the fixed-purpose root helper used by approval-gated GUI administration."""
import argparse,fcntl,json,os,shutil,socket,subprocess,sys,tempfile,time
from pathlib import Path
import update
from separate_gateway import atomic

UNIT='agentd-admin.service'
SOCKET='/run/agentd-admin/admin.sock'
DROP='110-administration.conf'

def paths(c):
    return Path('/etc/systemd/system')/UNIT,Path('/etc/systemd/system')/(c['runnerUnit']+'.d')/DROP

def probe(timeout=10):
    deadline=time.monotonic()+timeout
    while True:
        try:
            with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as client:
                client.settimeout(2);client.connect(SOCKET)
                client.sendall((json.dumps({'op':'rotate-access-key','currentKey':'invalid','newHash':'0'*64})+'\n').encode())
                data=client.recv(4096)
            break
        except (FileNotFoundError,ConnectionRefusedError,socket.timeout):
            if time.monotonic()>=deadline:raise ValueError('Administration helper socket did not become ready')
            time.sleep(0.1)
    if json.loads(data).get('ok') is not False:raise ValueError('Administration helper accepted an invalid step-up key')

def apply(c,config_path,previous,current,backup):
    unit,drop=paths(c)
    if any(p.exists() or p.is_symlink() for p in (unit,drop)):raise ValueError('Administration helper paths already exist; review before retrying')
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    new=dict(c,adminUnit=UNIT,adminSocket=SOCKET)
    new['configFiles']=[*c['configFiles'],str(unit),str(drop)]
    journal=Path(c['deployment'])/'administration-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        update.control_idle(c);update.run(['systemctl','stop',c['mobileUnit']]);update.control_idle(c);update.idle(Path(c['state']),previous['release']['taskSchemaVersion']);update.run(['systemctl','stop',c['runnerUnit']])
        if update.inventory(c)!=current:raise ValueError('Configuration changed during administration migration')
        changed=True
        unit.write_bytes((Path(c['app'])/'deploy'/UNIT).read_bytes());unit.chmod(0o644)
        drop.parent.mkdir(mode=0o755,exist_ok=True)
        atomic(drop,('[Unit]\nAfter='+UNIT+'\nWants='+UNIT+'\n[Service]\nEnvironment=AGENTD_ADMIN_SOCKET='+SOCKET+'\n').encode(),0o644)
        update.run(['systemctl','daemon-reload']);update.run(['systemctl','enable','--now',UNIT]);probe()
        update.run(['systemctl','start',c['runnerUnit']]);update.ready(new,previous['release']);update.run(['systemctl','start',c['mobileUnit']]);update.run(['systemctl','is-active','--quiet',UNIT,c['runnerUnit'],c['mobileUnit']])
        pid=update.capture(['systemctl','show',c['mobileUnit'],'--property=MainPID','--value']).strip()
        if not pid.isdigit() or int(pid)<1:raise ValueError('Gateway process missing')
        update.run(['nsenter','--target',pid,'--mount','--','runuser','-u',c['gatewayUser'],'--','/usr/bin/python3','-B',c['app']+'/scripts/gateway_probe.py','/etc/agentd-web/mobile.json',SOCKET,'/srv/agentd','/var/lib/agentd','/run/agentd','/etc/agentd'])
        target=update.inventory(new)
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode());atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode());journal.unlink()
        print('Fixed-purpose administration helper installed and invalid-key probe refused.')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            update.run(['systemctl','stop',c['mobileUnit'],c['runnerUnit']])
            subprocess.run(['systemctl','stop',UNIT],check=False)
            unit.unlink(missing_ok=True);drop.unlink(missing_ok=True);atomic(config_path,old_config);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        update.run(['systemctl','start',c['runnerUnit'],c['mobileUnit']]);raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    path=update.canonical(a.config);c=update.config(path)
    if c.get('adminUnit'):raise ValueError('Administration helper is already configured')
    if not c.get('gatewayUser') or c.get('gatewayHardening')!='gateway-hardening-v1':raise ValueError('Install the hardened separate gateway first')
    root=Path(c['deployment']);info=root.stat()
    if root.is_symlink() or info.st_uid!=0 or info.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending deployment recovery first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or 'src/admin-helper.ts' not in installed.get('files',{}):raise ValueError('Install a compatible managed application first')
        backup=Path(tempfile.mkdtemp(prefix='agentd-administration-backup-',dir=Path(c['app']).parent));apply(c,path,previous,current,backup)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Administration migration failed; inspect local logs and administration-pending.json.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
