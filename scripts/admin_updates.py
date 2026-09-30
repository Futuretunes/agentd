#!/usr/bin/env python3
"""Return a bounded, read-only view of installable approved releases and update progress."""
import json,re,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import run_approved_update as job
import run_rollback as rollback

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')
STATES={'running','succeeded','failed'}

def running(patterns=('agentd-update@*','agentd-rollback@*','agentd-restore@*','agentd-apply-resources.service','agentd-apply-gateway-hardening.service')):
    # A job counts as running while systemd reports any update or rollback instance active or starting.
    result=subprocess.run(['/usr/bin/systemctl','list-units','--no-legend','--plain','--all',*patterns],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5)
    return any(len(line.split())>=3 and line.split()[2] in ('active','activating','reloading','deactivating') for line in result.stdout.splitlines())

def last_status(deployment):
    try:value=json.loads((deployment/job.STATUS).read_text())
    except (OSError,ValueError):return None
    if value.get('format')!=1 or value.get('state') not in STATES or value.get('stage') not in job.STAGES:return None
    return {key:value.get(key) for key in ('kind','version','stage','state','message','startedAt','updatedAt','failedStage','revision','savedVersion','backupId') if isinstance(value.get(key),str)}

def snapshot(releases=job.RELEASES,deployment=DEPLOYMENT,config=CONFIG,is_running=running,owner=0,find_rollback=None):
    c=update.config(config);record=json.loads((deployment/'installed.json').read_text());installed=record['release']
    configuration=update.configuration_state(c,record.get('configuration'),deployment)
    candidates=[]
    for path in sorted(releases.glob('*.json')) if releases.is_dir() else []:
        version=path.stem
        if not job.VERSION.fullmatch(version):continue
        try:
            meta,_,manifest,_=job.approved(version,releases,owner)
            candidates.append({'version':version,'revision':manifest['revision'][:12],'taskSchemaVersion':manifest['taskSchemaVersion'],
              'schemaChange':manifest['taskSchemaVersion']!=installed.get('taskSchemaVersion'),'notes':str(meta.get('notes',''))[:600],
              'approvedAt':str(meta.get('approvedAt',''))[:40],'newer':job.version_key(version)>job.version_key(installed['version']),'valid':True})
        except Exception:
            candidates.append({'version':version,'valid':False,'newer':False})
    candidates.sort(key=lambda item:job.version_key(item['version']),reverse=True)
    try:
        target,reason=(find_rollback or (lambda:rollback.candidate(c,installed,config)))()
    except Exception:
        target,reason=None,'Rollback availability could not be determined.'
    rollback_view={'available':bool(target),'reason':None if target else reason}
    if target:
        rollback_view.update(version=target['version'],revision=target['revision'][:12],completedAt=target['completedAt'],
                             schemaChange=target['taskSchemaVersion']!=installed.get('taskSchemaVersion'),
                             backupId=target.get('backupId'))
    return {'format':1,'installed':{'version':installed['version'],'revision':str(installed.get('revision',''))[:12],'taskSchemaVersion':installed.get('taskSchemaVersion')},
      'configuration':configuration,'running':bool(is_running()),'job':last_status(deployment),'candidates':candidates[:10],'rollback':rollback_view}

if __name__=='__main__':
    try:print(json.dumps(snapshot(),separators=(',',':')))
    except Exception:
        print(json.dumps({'format':1,'error':'Updates are unavailable. Review local administrator logs.'},separators=(',',':')));sys.exit(1)
