#!/usr/bin/env python3
"""Return a sanitized, read-only AgentD configuration overview for Settings."""
import json,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import admin_diagnostics
import admin_tls

CONFIG=Path('/etc/agentd/update.json')
DEPLOYMENT=Path('/var/lib/agentd-deployment')

def snapshot():
    c=update.config(CONFIG)
    installed=json.loads((DEPLOYMENT/'installed.json').read_text())
    pending=sorted(p.name for p in DEPLOYMENT.glob('*pending.json'))
    state=update.configuration_state(c,installed.get('configuration'),DEPLOYMENT)
    cert_path=None
    for path in c.get('configFiles',[]):
        if str(path).endswith('.crt') or str(path).endswith('.pem'):
            cert_path=str(path);break
    try:
        result=subprocess.run(['/usr/bin/systemctl','show',c['mobileUnit'],'--property=Environment','--value'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5)
        for item in result.stdout.split():
            if item.startswith('AGENTD_TLS_CERT='):
                cert_path=item.split('=',1)[1] or cert_path
    except (OSError,subprocess.SubprocessError,KeyError):
        pass
    tls=admin_tls.metadata(Path(cert_path)) if cert_path else admin_tls.metadata()
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
        'tls':tls,
        'notes':{
            'agents':'Change enabled agents and edit permissions from this Configuration page (adapter policy). Account login stays under Agents & accounts.',
            'github':'Manage the GitHub connection from Settings > GitHub.',
            'notifications':'Configure an ntfy destination from this Configuration page. Approval requests and completed/failed runs send pushes when configured.',
            'mutations':'Missing resource profile or gateway hardening can be enabled here (one-way). Adapter policy, runtime flags, TLS certificate replacement and the ntfy destination can also be changed; restart the affected service afterward when required.',
        },
    }

if __name__=='__main__':
    try:print(json.dumps(snapshot(),separators=(',',':')))
    except Exception:
        print(json.dumps({'format':1,'error':'Configuration overview is unavailable.'},separators=(',',':')))
        sys.exit(1)
