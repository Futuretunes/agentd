#!/usr/bin/env python3
"""Re-record the managed configuration baseline after a reviewed, explained change.

Only tracked configuration files may be reconciled; any unit, drop-in, environment or
service-property difference is refused. A file whose bytes still match the recorded
digest (for example after the v2 fingerprint change) is accepted automatically. A file
whose bytes changed must be named with --accept after the operator has reviewed why.
Plan is the default; --apply writes the new baseline and keeps the old one alongside.
"""
import argparse,fcntl,hashlib,json,os,sys,time
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
from separate_gateway import atomic

def recorded_digest(entry):
    # v1 baselines stored a raw content SHA-256; v2 stores a fingerprint object.
    return entry if isinstance(entry,str) else None

def plan(c,previous,current):
    old,new=previous['configuration'],current
    if {k:v for k,v in old.items() if k!='configuration'}!={k:v for k,v in new.items() if k!='configuration'}:
        raise ValueError('Units, drop-ins or service properties differ; reconcile those deliberately, not here')
    oldfiles,newfiles=old.get('configuration',{}),new.get('configuration',{})
    if set(oldfiles)!=set(newfiles):raise ValueError('The set of tracked configuration files changed')
    unchanged,changed=[],[]
    for name in sorted(newfiles):
        if oldfiles[name]==newfiles[name]:continue
        digest=recorded_digest(oldfiles[name])
        if digest and digest==hashlib.sha256(Path(name).read_bytes()).hexdigest():unchanged.append(name)
        else:changed.append(name)
    return unchanged,changed

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',required=True);parser.add_argument('--accept',action='append',default=[])
    parser.add_argument('--apply',action='store_true');a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    c=update.config(update.canonical(a.config));root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery first')
        record=root/'installed.json';previous=json.loads(record.read_text())
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release']:raise ValueError('Installed application differs from the recorded release')
        current=update.inventory(c);unchanged,changed=plan(c,previous,current)
        print(json.dumps({'formatOnly':unchanged,'contentChanged':changed,'accepted':sorted(a.accept)}))
        if not unchanged and not changed:print('Configuration already matches the recorded baseline.');return
        if sorted(set(a.accept))!=changed:raise ValueError('Name every content-changed file with --accept, and nothing else')
        if not a.apply:print('Plan only. Re-run with --apply to record this baseline.');return
        backup=root/('installed.json.'+time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'.bak')
        backup.write_bytes(record.read_bytes());backup.chmod(0o600)
        atomic(record,(json.dumps(dict(previous,configuration=current),indent=2)+'\n').encode())
        print('Baseline recorded. Previous baseline: '+backup.name)

if __name__=='__main__':
    try:main()
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
