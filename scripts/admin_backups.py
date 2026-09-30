#!/usr/bin/env python3
"""Bounded, sanitized view and approval-gated prune of managed application backups."""
import json,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import backup_retention
import run_rollback as rollback

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')

def public_item(item,rollback_id=None,restorable_ids=None):
    name=Path(item['path']).name
    if not name.startswith('agentd-backup-'):raise ValueError('Unexpected backup name')
    return {
        'id':name,
        'version':str(item.get('version') or 'unknown')[:32],
        'completedAt':int(item['completed']),
        'bytes':int(item.get('bytes') or 0),
        'pinned':bool(item.get('pinned')),
        'eligible':bool(item.get('eligible')),
        'rollbackTarget':bool(rollback_id and name==rollback_id),
        'restorable':bool(restorable_ids and name in restorable_ids),
    }

def snapshot():
    c=update.config(CONFIG)
    value=backup_retention.plan(c)
    rollback_id=None
    restorable_ids=set()
    rollback_view={'available':False,'reason':'Rollback target is unavailable.','backupId':None}
    try:
        installed=json.loads((DEPLOYMENT/'installed.json').read_text())['release']
        target,reason=rollback.candidate(c,installed,CONFIG)
        if target:
            rollback_id=Path(target['path']).name
            rollback_view={
                'available':True,
                'version':target['version'],
                'revision':target['revision'][:12],
                'completedAt':target['completedAt'],
                'backupId':rollback_id,
                'reason':None,
            }
        else:
            rollback_view={'available':False,'reason':reason or 'No earlier version backup is available.','backupId':None}
        # Selected restore uses agentd-restore@.service beside rollback; no update.json key
        # so older releases remain configuration-compatible.
        if c.get('rollbackUnit') and Path('/etc/systemd/system/agentd-restore@.service').is_file():
            restorable_ids=rollback.restorable(c,installed,CONFIG)
    except Exception:
        pass
    return {
        'format':1,
        'keep':value['keep'],
        'minimumAgeDays':value['minimumAgeDays'],
        'blocked':bool(value['blocked']),
        'fingerprint':value['fingerprint'],
        'rollback':rollback_view,
        'restoreEnabled':bool(c.get('rollbackUnit') and Path('/etc/systemd/system/agentd-restore@.service').is_file()),
        'items':[public_item(item,rollback_id,restorable_ids) for item in value['items']],
    }

def prune(fingerprint):
    if not isinstance(fingerprint,str) or len(fingerprint)!=64 or any(c not in '0123456789abcdef' for c in fingerprint):
        raise ValueError('Invalid backup cleanup fingerprint')
    c=update.config(CONFIG)
    count=backup_retention.prune(c,fingerprint)
    return {'removed':int(count),'format':1}

if __name__=='__main__':
    try:
        if len(sys.argv)==1:
            print(json.dumps(snapshot(),separators=(',',':')))
        elif len(sys.argv)==3 and sys.argv[1]=='prune':
            print(json.dumps(prune(sys.argv[2]),separators=(',',':')))
        else:
            raise ValueError('Unsupported backups request')
    except Exception:
        print(json.dumps({'format':1,'error':'Backups are unavailable. Review local administrator logs.'},separators=(',',':')))
        sys.exit(1)
