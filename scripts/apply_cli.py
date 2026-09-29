#!/usr/bin/env python3
"""Enable Settings > Agents & CLIs approved Cursor installs.

Installs the fixed agentd-cli-install@.service job unit and the root-only
approved-CLI directory. No service is restarted.
"""
import argparse,fcntl,json,os,subprocess,sys,tempfile
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import admin_cli as cli
from separate_gateway import atomic

UNIT='agentd-cli-install@.service'
KEY='cliUnit'

def unit_path():return Path('/etc/systemd/system')/UNIT

def verify(c):
    if not c.get(KEY):raise ValueError('CLI install unit is not configured')
    loaded=update.capture(['systemctl','show',UNIT.replace('@.','@cursor_0.0.0-deadbee.'),'--property=LoadState','--property=FragmentPath'])
    values=dict(line.split('=',1) for line in loaded.splitlines() if '=' in line)
    if values.get('LoadState')!='loaded' or values.get('FragmentPath')!=str(unit_path()):
        raise ValueError('CLI install job unit is not loaded')
    info=cli.RELEASES.lstat()
    if cli.RELEASES.is_symlink() or info.st_uid!=0 or info.st_mode&0o077:
        raise ValueError('Approved CLI directory must be root-only')

def apply(c,config_path,previous,current,backup):
    old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    path=unit_path()
    new=dict(c,cliUnit=UNIT,configFiles=[*c['configFiles'],str(path)])
    journal=Path(c['deployment'])/'cli-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        if update.inventory(c)!=current:raise ValueError('Configuration drift before enabling CLI installs')
        changed=True
        atomic(path,(Path(c['app'])/'deploy'/UNIT).read_bytes(),0o644)
        cli.RELEASES.mkdir(mode=0o700,exist_ok=True)
        update.run(['systemctl','daemon-reload']);verify(new);target=update.inventory(new)
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode())
        atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode())
        journal.unlink()
        print('Approved CLI installs enabled: '+UNIT+' installed; '+str(cli.RELEASES)+' ready.')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            path.unlink(missing_ok=True)
            atomic(config_path,old_config);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        else:
            journal.unlink(missing_ok=True)
        raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    path=update.canonical(a.config);c=update.config(path)
    if not c.get('adminUnit'):raise ValueError('The administration helper is required first')
    if c.get(KEY):
        verify(c);print('Approved CLI installs already enabled and verified.');return
    root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or 'scripts/run_approved_cli.py' not in installed.get('files',{}):
            raise ValueError('Install a release containing the CLI install helper first')
        if unit_path().exists():raise ValueError('A CLI install job unit already exists; review it first')
        backup=Path(tempfile.mkdtemp(prefix='agentd-cli-backup-',dir=Path(c['app']).parent))
        apply(c,path,previous,current,backup)

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Enabling CLI installs failed; inspect local logs.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
