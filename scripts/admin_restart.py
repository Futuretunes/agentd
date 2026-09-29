#!/usr/bin/env python3
"""Restart one fixed AgentD service unit after managed configuration checks."""
import json,re,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import admin_updates

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')
TARGETS={'runner':'runnerUnit','gateway':'mobileUnit'}

def restart(target):
    if target not in TARGETS:raise ValueError('Invalid restart target')
    if admin_updates.running():raise RuntimeError('An update or rollback is already running')
    c=update.config(CONFIG)
    record=json.loads((DEPLOYMENT/'installed.json').read_text())
    if update.configuration_state(c,record.get('configuration'),DEPLOYMENT)!='ok':
        raise RuntimeError('Configuration needs review first')
    unit=c[TARGETS[target]]
    if not re.fullmatch(r'[A-Za-z0-9_@.-]+\.service',unit):raise ValueError('Invalid unit')
    subprocess.run(['/usr/bin/systemctl','restart',unit],check=True,timeout=60,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env={'PATH':'/usr/bin:/bin','LANG':'C'})
    return {'restarted':True,'target':target}

if __name__=='__main__':
    try:
        if len(sys.argv)!=2:raise ValueError('Target required')
        print(json.dumps(restart(sys.argv[1]),separators=(',',':')))
    except Exception:
        print(json.dumps({'error':'Service restart is unavailable. Review local administrator logs.'},separators=(',',':')))
        sys.exit(1)
