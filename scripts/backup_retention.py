#!/usr/bin/env python3
"""Bounded retention for successful managed application backups only.
Legacy, failed, configuration and pinned backups are never automatically removed.
"""
import argparse, hashlib, json, os, shutil, stat, sys, time
from pathlib import Path
ROOT_UID=0
RESERVE=2*1024**3
MAX_BACKUP=5*1024**3
MAX_TOTAL=20*1024**3
KEEP=3
AGE=30*86400
MARKER='managed-retention.json'

def size(path,limit=MAX_TOTAL):
    total=0;entries=0
    for directory,dirs,files in os.walk(path,followlinks=False):
        for name in [*dirs,*files]:
            p=Path(directory)/name;s=p.lstat();entries+=1
            if entries>500000:raise ValueError('Backup inventory exceeds its entry budget')
            if stat.S_ISREG(s.st_mode):total+=max(s.st_size,s.st_blocks*512)
            elif not (stat.S_ISDIR(s.st_mode) or stat.S_ISLNK(s.st_mode)):raise ValueError('Special files require manual backup review')
            if total>limit:raise ValueError('Backup storage budget reached')
    return total

def records(c):
    items=[]
    for path in Path(c['app']).parent.glob('agentd-backup-*'):
        s=path.lstat()
        if not stat.S_ISDIR(s.st_mode) or s.st_uid!=ROOT_UID or s.st_mode&0o077:continue
        marker=path/MARKER
        try:
            m=marker.lstat()
            if not stat.S_ISREG(m.st_mode) or m.st_uid!=ROOT_UID or m.st_nlink!=1 or m.st_size>8192:continue
            data=json.loads(marker.read_text())
            if data.get('format')!=1 or data.get('dev')!=s.st_dev or data.get('ino')!=s.st_ino or not isinstance(data.get('completed'),(int,float)):continue
            if any((path/name).is_symlink() or not (path/name).is_dir() for name in ('app','state')):continue
            items.append({'path':str(path),'completed':data['completed'],'dev':s.st_dev,'ino':s.st_ino,'bytes':0,'pinned':(path/'KEEP').exists(),'version':data.get('version')})
        except (OSError,ValueError,TypeError):continue
    for item in items:item['bytes']=size(Path(item['path']))
    return sorted(items,key=lambda x:(x['completed'],x['path']),reverse=True)

def plan(c,now=None):
    now=time.time() if now is None else now
    pending=any((Path(c['deployment'])/name).exists() for name in ('pending.json','gateway-pending.json','resources-pending.json'))
    items=records(c)
    for i,item in enumerate(items):
        item['eligible']=not pending and i>=KEEP and not item['pinned'] and item['completed']<=now-AGE
    fingerprint=hashlib.sha256(json.dumps(items,sort_keys=True).encode()).hexdigest()
    return {'items':items,'fingerprint':fingerprint,'blocked':pending,'keep':KEEP,'minimumAgeDays':30}

def prune(c,fingerprint=None):
    value=plan(c)
    if value['blocked']:raise ValueError('Resolve pending recovery before backup cleanup')
    if fingerprint is not None and fingerprint!=value['fingerprint']:raise ValueError('Backup inventory changed; preview again')
    count=0
    for item in value['items']:
        if not item['eligible']:continue
        path=Path(item['path']);s=path.lstat()
        if not stat.S_ISDIR(s.st_mode) or s.st_uid!=ROOT_UID or s.st_dev!=item['dev'] or s.st_ino!=item['ino'] or (path/'KEEP').exists():raise ValueError('Backup changed during cleanup')
        # Linux shutil uses fd-based traversal; refuse platforms without it.
        if not shutil.rmtree.avoids_symlink_attacks:raise ValueError('Safe directory removal unavailable')
        shutil.rmtree(path);count+=1
    return count

def admission(c):
    required=size(Path(c['state']),MAX_BACKUP)+size(Path(c['app']),MAX_BACKUP)
    if required>MAX_BACKUP:raise ValueError('Prospective backup exceeds 5 GiB; review storage before updating')
    if sum(x['bytes'] for x in records(c))+required>MAX_TOTAL:raise ValueError('Managed backups exceed 20 GiB; review retained/pinned backups before updating')
    if shutil.disk_usage(Path(c['app']).parent).free<required+RESERVE:raise ValueError('Insufficient disk reserve for a rollback backup')

def completed(c,backup,previous):
    path=Path(backup);s=path.lstat()
    if s.st_uid!=ROOT_UID or s.st_mode&0o077:raise ValueError('Backup must be private and root-owned')
    data={'format':1,'dev':s.st_dev,'ino':s.st_ino,'completed':time.time(),'version':(previous or {}).get('release',{}).get('version')}
    marker=path/MARKER
    with marker.open('x') as f:json.dump(data,f)
    marker.chmod(0o600)

if __name__=='__main__':
    import fcntl,update
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['plan','apply']);p.add_argument('--config',required=True);p.add_argument('--fingerprint');a=p.parse_args()
    if os.geteuid()!=0:raise SystemExit('Administrator required')
    c=update.config(a.config);root=Path(c['deployment'])
    if root.is_symlink() or root.stat().st_uid!=0 or root.stat().st_mode&0o077:raise SystemExit('Invalid deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if a.command=='plan':print(json.dumps(plan(c),indent=2))
        elif not a.fingerprint:raise SystemExit('Preview fingerprint required')
        else:print('Removed completed managed backups: '+str(prune(c,a.fingerprint)))
