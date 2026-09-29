#!/usr/bin/env python3
"""Upgrade the fixed administration helper for bounded read-only diagnostics."""
import argparse,fcntl,json,os,socket,subprocess,sys,tempfile
from pathlib import Path
import update
from separate_gateway import atomic

UNIT='agentd-admin.service'
SOCKET='/run/agentd-admin/admin.sock'

def unit_path():return Path('/etc/systemd/system')/UNIT

def probe():
    with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as client:
        client.settimeout(10);client.connect(SOCKET)
        client.sendall(b'{"op":"diagnostics"}\n');data=b''
        while not data.endswith(b'\n'):
            chunk=client.recv(32768)
            if not chunk or len(data)+len(chunk)>32768:raise ValueError('Invalid diagnostics response')
            data+=chunk
    value=json.loads(data)
    result=value.get('result',{})
    if value.get('ok') is not True or result.get('format')!=1 or not isinstance(result.get('services'),dict):raise ValueError('Administration diagnostics probe failed')

def apply(c,previous,current,backup):
    path=unit_path();record=Path(c['deployment'])/'installed.json'
    if path.is_symlink() or not path.is_file():raise ValueError('Administration helper unit is not a regular file')
    old_unit=path.read_bytes();old_record=record.read_bytes()
    (backup/'agentd-admin.service').write_bytes(old_unit);(backup/'installed.json').write_bytes(old_record)
    journal=Path(c['deployment'])/'diagnostics-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        update.control_idle(c);update.run(['systemctl','stop',c['mobileUnit']]);update.control_idle(c);update.idle(Path(c['state']),previous['release']['taskSchemaVersion']);update.run(['systemctl','stop',c['runnerUnit'],UNIT])
        if update.inventory(c)!=current:raise ValueError('Configuration changed during diagnostics migration')
        changed=True;atomic(path,(Path(c['app'])/'deploy'/UNIT).read_bytes(),0o644)
        update.run(['systemctl','daemon-reload']);update.run(['systemctl','enable','--now',UNIT]);probe()
        target=update.inventory(c)
        update.run(['systemctl','start',c['runnerUnit']]);update.ready(c,previous['release']);update.run(['systemctl','start',c['mobileUnit']]);update.run(['systemctl','is-active','--quiet',UNIT,c['runnerUnit'],c['mobileUnit']])
        if update.inventory(c)!=target:raise ValueError('Configuration changed during diagnostics restart')
        atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode());journal.unlink()
        print('Read-only administration diagnostics installed and verified.')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            subprocess.run(['systemctl','stop',c['mobileUnit'],c['runnerUnit'],UNIT],check=False)
            atomic(path,old_unit,0o644);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        update.run(['systemctl','start',UNIT,c['runnerUnit'],c['mobileUnit']]);raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    config_path=update.canonical(a.config);c=update.config(config_path)
    if c.get('adminUnit')!=UNIT or c.get('adminSocket')!=SOCKET:raise ValueError('Install the administration helper first')
    root=Path(c['deployment']);info=root.stat()
    if root.is_symlink() or info.st_uid!=0 or info.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending deployment recovery first')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or 'scripts/admin_diagnostics.py' not in installed.get('files',{}):raise ValueError('Install a compatible managed application first')
        backup=Path(tempfile.mkdtemp(prefix='agentd-diagnostics-backup-',dir=Path(c['app']).parent));apply(c,previous,current,backup)

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('Diagnostics migration failed; inspect local logs and diagnostics-pending.json.' if isinstance(error,subprocess.CalledProcessError) else str(error),file=sys.stderr);sys.exit(1)
