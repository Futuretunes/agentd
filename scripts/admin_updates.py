#!/usr/bin/env python3
"""Return a bounded, read-only view of installable approved releases and update progress."""
import json,re,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import run_approved_update as job

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')
STATES={'running','succeeded','failed'}

def running(unit_prefix='agentd-update@'):
    # A job counts as running while systemd reports any instance active or starting.
    result=subprocess.run(['/usr/bin/systemctl','list-units','--no-legend','--plain','--all',unit_prefix+'*'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5)
    return any(len(line.split())>=3 and line.split()[2] in ('active','activating','reloading','deactivating') for line in result.stdout.splitlines())

def last_status(deployment):
    try:value=json.loads((deployment/job.STATUS).read_text())
    except (OSError,ValueError):return None
    if value.get('format')!=1 or value.get('state') not in STATES or value.get('stage') not in job.STAGES:return None
    return {key:value.get(key) for key in ('version','stage','state','message','startedAt','updatedAt','failedStage','revision') if isinstance(value.get(key),str)}

def snapshot(releases=job.RELEASES,deployment=DEPLOYMENT,config=CONFIG,is_running=running,owner=0):
    c=update.config(config);record=json.loads((deployment/'installed.json').read_text());installed=record['release']
    if list(deployment.glob('*pending.json')):configuration='recovery_required'
    else:
        try:configuration='ok' if update.inventory(c)==record.get('configuration') else 'drift'
        except Exception:configuration='drift'
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
    return {'format':1,'installed':{'version':installed['version'],'revision':str(installed.get('revision',''))[:12],'taskSchemaVersion':installed.get('taskSchemaVersion')},
      'configuration':configuration,'running':bool(is_running()),'job':last_status(deployment),'candidates':candidates[:10]}

if __name__=='__main__':
    try:print(json.dumps(snapshot(),separators=(',',':')))
    except Exception:
        print(json.dumps({'format':1,'error':'Updates are unavailable. Review local administrator logs.'},separators=(',',':')));sys.exit(1)
