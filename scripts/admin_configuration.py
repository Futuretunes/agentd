#!/usr/bin/env python3
"""Return a sanitized, read-only AgentD configuration overview for Settings."""
import json,os,re,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import admin_diagnostics

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')

def tls_expiry(path):
    if not isinstance(path,str) or not path.startswith('/') or '..' in path:return None
    try:
        info=os.lstat(path)
        if not os.path.isfile(path) or os.path.islink(path) or info.st_size>65536:return None
        result=subprocess.run(['/usr/bin/openssl','x509','-in',path,'-noout','-enddate'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5,env={'PATH':'/usr/bin:/bin','LANG':'C'})
        match=re.fullmatch(r'notAfter=(.+)',result.stdout.strip())
        if not match:return None
        # Keep the OpenSSL date string bounded; do not invent timezone conversion here.
        return match.group(1)[:64]
    except (OSError,subprocess.SubprocessError,ValueError):
        return None

def snapshot():
    c=update.config(CONFIG)
    installed=json.loads((DEPLOYMENT/'installed.json').read_text())
    pending=sorted(p.name for p in DEPLOYMENT.glob('*pending.json'))
    state=update.configuration_state(c,installed.get('configuration'),DEPLOYMENT)
    cert=None
    for path in c.get('configFiles',[]):
        if str(path).endswith('.crt') or str(path).endswith('.pem'):
            cert=tls_expiry(path)
            if cert:break
    # Prefer the gateway certificate named in mobile unit environment when present.
    try:
        result=subprocess.run(['/usr/bin/systemctl','show',c['mobileUnit'],'--property=Environment','--value'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5)
        for item in result.stdout.split():
            if item.startswith('AGENTD_TLS_CERT='):
                cert=tls_expiry(item.split('=',1)[1]) or cert
    except (OSError,subprocess.SubprocessError,KeyError):
        pass
    return {
        'format':1,
        'generatedAt':datetime.now(timezone.utc).isoformat(),
        'configuration':{
            'state':state,
            'recoveryPending':bool(pending),
            'resourceProfile':c.get('resourceProfile')=='standard-v1',
            'gatewayHardening':c.get('gatewayHardening')=='gateway-hardening-v1',
            'separateGateway':bool(c.get('gatewayUser')),
            'administrationHelper':bool(c.get('adminUnit')),
            'gatewayConfigReadable':admin_diagnostics.gateway_config_readable(c),
        },
        'tls':{'certificateExpires':cert},
        'notes':{
            'agents':'Change enabled agents and edit permissions from this Configuration page (adapter policy). Account login stays under Agents & accounts.',
            'github':'Manage the GitHub connection from Settings > GitHub.',
            'notifications':'Mobile notifications (ntfy) are not configured in-app yet.',
            'mutations':'Resource profile, hardening and TLS replacement remain future work. Adapter policy and runtime flags can be changed here; restart the task runner afterward.',
        },
    }

if __name__=='__main__':
    try:print(json.dumps(snapshot(),separators=(',',':')))
    except Exception:
        print(json.dumps({'format':1,'error':'Configuration overview is unavailable.'},separators=(',',':')))
        sys.exit(1)
