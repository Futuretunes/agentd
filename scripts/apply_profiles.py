#!/usr/bin/env python3
"""Enable Settings > Configuration apply jobs for resource and gateway profiles.

Installs fixed oneshot units only. No new update.json keys are added, so older
releases remain configuration-compatible. No service is restarted by this script.
"""
import argparse,fcntl,json,os,subprocess,sys,tempfile
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
from separate_gateway import atomic

UNITS=('agentd-apply-resources.service','agentd-apply-gateway-hardening.service')

def unit_path(unit):return Path('/etc/systemd/system')/unit

def verify(c):
    for unit in UNITS:
        loaded=update.capture(['systemctl','show',unit,'--property=LoadState','--property=FragmentPath'])
        values=dict(line.split('=',1) for line in loaded.splitlines() if '=' in line)
        if values.get('LoadState')!='loaded' or values.get('FragmentPath')!=str(unit_path(unit)):
            raise ValueError('Profile apply unit is not loaded: '+unit)

def apply(c,config_path,previous,current,backup,missing):
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    paths=[unit_path(unit) for unit in missing]
    new=dict(c,configFiles=[*c['configFiles'],*map(str,paths)])
    journal=Path(c['deployment'])/'profiles-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        if update.inventory(c)!=current:raise ValueError('Configuration drift before enabling profile jobs')
        changed=True
        for unit,path in zip(missing,paths):
            atomic(path,(Path(c['app'])/'deploy'/unit).read_bytes(),0o644)
        update.run(['systemctl','daemon-reload']);verify(new);target=update.inventory(new)
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode())
        atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode())
        journal.unlink()
        print('Configuration profile jobs enabled: '+', '.join(missing))
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            for path in paths:path.unlink(missing_ok=True)
            atomic(config_path,old_config);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        else:journal.unlink(missing_ok=True)
        raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    path=update.canonical(a.config);c=update.config(path)
    if not c.get('adminUnit'):raise ValueError('The administration helper is required first')
    missing=[unit for unit in UNITS if not unit_path(unit).exists()]
    if not missing:verify(c);print('Configuration profile jobs already enabled and verified.');return
    root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or 'scripts/apply_resources.py' not in installed.get('files',{}):
            raise ValueError('Install a release containing profile apply scripts first')
        for unit in missing:
            if unit_path(unit).exists():raise ValueError('A profile job unit already exists; review it first: '+unit)
        backup=Path(tempfile.mkdtemp(prefix='agentd-profiles-backup-',dir=Path(c['app']).parent))
        apply(c,path,previous,current,backup,missing)

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Enabling profile jobs failed; inspect local logs.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
