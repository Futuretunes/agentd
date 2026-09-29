#!/usr/bin/env python3
"""Return a bounded, normalized AgentD diagnostic snapshot; never raw config or logs."""
import json,os,pwd,re,shutil,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')
ALLOWED_STATES={'active','inactive','failed','activating','deactivating','reloading','maintenance','unknown'}

def service(unit):
    if not re.fullmatch(r'[A-Za-z0-9_-]+\.service',unit):raise ValueError('Invalid unit')
    result=subprocess.run(['/usr/bin/systemctl','show',unit,'--property=ActiveState','--property=SubState','--property=NRestarts','--property=ExecMainStartTimestamp'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5,env={'PATH':'/usr/bin:/bin','LANG':'C'})
    values=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
    active=values.get('ActiveState','unknown');sub=values.get('SubState','unknown')
    if active not in ALLOWED_STATES or not re.fullmatch(r'[a-z-]{1,32}',sub):raise ValueError('Unexpected service state')
    restarts=values.get('NRestarts','0')
    return {'state':active,'detail':sub,'restarts':int(restarts) if restarts.isdigit() else None,'since':values.get('ExecMainStartTimestamp') or None}

def gateway_config_readable(c):
    # The gateway reads this at start; if its user cannot, the next restart fails.
    paths=[p for p in c.get('configFiles',[]) if p.endswith('mobile.json')]
    if not paths:return None
    try:
        info=os.stat(paths[0]);account=pwd.getpwnam(c.get('gatewayUser') or c['user'])
    except (OSError,KeyError):return False
    return bool(info.st_uid==account.pw_uid and info.st_mode&0o400 or info.st_gid==account.pw_gid and info.st_mode&0o040 or info.st_mode&0o004)

def snapshot():
    c=update.config(CONFIG);installed=json.loads((DEPLOYMENT/'installed.json').read_text())
    pending=sorted(p.name for p in DEPLOYMENT.glob('*pending.json'))
    if pending:configuration='recovery_required'
    else:
        try:configuration='ok' if update.inventory(c)==installed.get('configuration') else 'drift'
        except Exception:configuration='drift'
    release=installed.get('release',{});revision=str(release.get('revision',''))
    if not re.fullmatch(r'[a-f0-9]{40}',revision):revision=''
    usage=shutil.disk_usage(c['app'])
    units={'runner':c['runnerUnit'],'gateway':c['mobileUnit']}
    if c.get('adminUnit'):units['administration']=c['adminUnit']
    return {
      'format':1,
      'generatedAt':datetime.now(timezone.utc).isoformat(),
      'release':{'version':str(release.get('version','unknown'))[:32],'revision':revision[:12] or None,'taskSchemaVersion':release.get('taskSchemaVersion') if isinstance(release.get('taskSchemaVersion'),int) else None},
      'configuration':{'state':configuration,'recoveryPending':bool(pending),'gatewayConfigReadable':gateway_config_readable(c),'resourceProfile':c.get('resourceProfile')=='standard-v1','gatewayHardening':c.get('gatewayHardening')=='gateway-hardening-v1','separateGateway':bool(c.get('gatewayUser')),'administrationHelper':bool(c.get('adminUnit'))},
      'services':{name:service(unit) for name,unit in units.items()},
      'storage':{'freeBytes':usage.free,'totalBytes':usage.total},
    }

if __name__=='__main__':
    try:print(json.dumps(snapshot(),separators=(',',':')))
    except Exception:
        print(json.dumps({'format':1,'error':'Diagnostics are unavailable. Review local administrator logs.'},separators=(',',':')))
        sys.exit(1)
