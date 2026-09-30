#!/usr/bin/env python3
"""Enable Settings > Updates: install the fixed update and rollback job units (and the
selected-backup restore unit alongside rollback) and the approved-releases directory.
Installs only the units that are missing.

No service is restarted. The administration helper can then start
agentd-update@<version>.service, agentd-rollback@<version>.service or
agentd-restore@<backup-id>.service; nothing else changes.
"""
import argparse,fcntl,json,os,subprocess,sys,tempfile
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import run_approved_update as job
from separate_gateway import atomic
# Configuration key -> (unit template, script the installed release must contain).
# agentd-restore@.service is installed with rollbackUnit and is not tracked as its own
# update.json key, so older releases that reject unknown optional fields remain restorable.
UNITS={'updateUnit':('agentd-update@.service','scripts/run_approved_update.py'),
       'rollbackUnit':('agentd-rollback@.service','scripts/run_rollback.py')}
RESTORE_UNIT='agentd-restore@.service'

def unit_path(unit):return Path('/etc/systemd/system')/unit

def verify(c):
    for key,(unit,_) in UNITS.items():
        if not c.get(key):continue
        loaded=update.capture(['systemctl','show',unit.replace('@.','@0.0.0.'),'--property=LoadState','--property=FragmentPath'])
        values=dict(line.split('=',1) for line in loaded.splitlines() if '=' in line)
        if values.get('LoadState')!='loaded' or values.get('FragmentPath')!=str(unit_path(unit)):raise ValueError('Job unit is not loaded: '+unit)
    if c.get('rollbackUnit'):
        loaded=update.capture(['systemctl','show',RESTORE_UNIT.replace('@.','@agentd-backup-dead.'),'--property=LoadState','--property=FragmentPath'])
        values=dict(line.split('=',1) for line in loaded.splitlines() if '=' in line)
        if values.get('LoadState')!='loaded' or values.get('FragmentPath')!=str(unit_path(RESTORE_UNIT)):
            raise ValueError('Job unit is not loaded: '+RESTORE_UNIT)
    info=job.RELEASES.lstat()
    if job.RELEASES.is_symlink() or info.st_uid!=0 or info.st_mode&0o077:raise ValueError('Approved-releases directory must be root-only')

def apply(c,config_path,previous,current,backup,missing):
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    paths=[unit_path(UNITS[key][0]) for key in missing]
    restore_needed=bool(c.get('rollbackUnit') or 'rollbackUnit' in missing)
    restore_path=unit_path(RESTORE_UNIT) if restore_needed and not unit_path(RESTORE_UNIT).exists() else None
    if restore_path:paths.append(restore_path)
    new=dict(c,**{key:UNITS[key][0] for key in missing})
    tracked=[*c['configFiles'],*[str(unit_path(UNITS[key][0])) for key in missing]]
    if restore_path:tracked.append(str(restore_path))
    new['configFiles']=tracked
    journal=Path(c['deployment'])/'updates-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        if update.inventory(c)!=current:raise ValueError('Configuration drift before enabling updates')
        changed=True
        for key in missing:atomic(unit_path(UNITS[key][0]),(Path(c['app'])/'deploy'/UNITS[key][0]).read_bytes(),0o644)
        if restore_path:atomic(restore_path,(Path(c['app'])/'deploy'/RESTORE_UNIT).read_bytes(),0o644)
        job.RELEASES.mkdir(mode=0o700,exist_ok=True)
        update.run(['systemctl','daemon-reload']);verify(new);target=update.inventory(new)
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode());atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode());journal.unlink()
        installed=', '.join([UNITS[key][0] for key in missing]+([RESTORE_UNIT] if restore_path else []))
        print('In-app updates enabled: '+installed+' installed; approved-releases directory ready.')
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
    missing=[key for key in UNITS if not c.get(key)]
    restore_missing=bool(c.get('rollbackUnit') or 'rollbackUnit' in missing) and not unit_path(RESTORE_UNIT).exists()
    if not missing and not restore_missing:verify(c);print('In-app updates, rollback and restore already enabled and verified.');return
    root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        needed_scripts=[UNITS[key][1] for key in missing]
        if restore_missing:needed_scripts.append('scripts/run_rollback.py')
        if installed!=previous['release'] or any(script not in installed.get('files',{}) for script in needed_scripts):
            raise ValueError('Install a release containing in-app updates, rollback and restore first')
        for key in missing:
            if unit_path(UNITS[key][0]).exists():raise ValueError('A job unit already exists; review it first: '+UNITS[key][0])
        backup=Path(tempfile.mkdtemp(prefix='agentd-updates-backup-',dir=Path(c['app']).parent));apply(c,path,previous,current,backup,missing)

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Enabling updates failed; inspect local logs.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
