#!/usr/bin/env python3
"""Bounded view and approval-gated start of resource/gateway profile apply jobs."""
import json,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import admin_updates

CONFIG=Path('/etc/agentd/update.json')
UNITS={
    'resource':'agentd-apply-resources.service',
    'hardening':'agentd-apply-gateway-hardening.service',
}

def jobs_enabled():
    return all((Path('/etc/systemd/system')/unit).is_file() for unit in UNITS.values())

def running(patterns=tuple(UNITS.values())):
    return admin_updates.running(patterns)

def snapshot(config=CONFIG,enabled=None,is_running=None):
    c=update.config(config)
    resource=c.get('resourceProfile')=='standard-v1'
    hardening=c.get('gatewayHardening')=='gateway-hardening-v1'
    jobs=jobs_enabled() if enabled is None else bool(enabled)
    active=bool(running() if is_running is None else is_running())
    return {
        'format':1,
        'jobsEnabled':jobs,
        'running':active,
        'resourceProfile':resource,
        'gatewayHardening':hardening,
        'canEnableResource':bool(jobs and c.get('gatewayUser') and not resource),
        'canEnableHardening':bool(jobs and resource and c.get('gatewayUser') and not hardening),
    }

def start(target,snapshot_fn=snapshot,start_unit=None,updates_running=None):
    if target not in UNITS:raise ValueError('Invalid profile apply target')
    value=snapshot_fn()
    if value['running']:raise ValueError('A profile apply job is already running')
    if not value['jobsEnabled']:raise ValueError('Configuration profile jobs are not enabled')
    if target=='resource' and not value['canEnableResource']:
        raise ValueError('Standard resource profile is not available to enable')
    if target=='hardening' and not value['canEnableHardening']:
        raise ValueError('Gateway hardening is not available to enable')
    check=updates_running if updates_running is not None else admin_updates.running
    if check():raise ValueError('An update or rollback is already running')
    unit=UNITS[target]
    if start_unit is None:
        subprocess.run(['/usr/bin/systemctl','start','--no-block',unit],check=True,timeout=10,
                       stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env={'PATH':'/usr/bin:/bin','LANG':'C'})
    else:
        start_unit(unit)
    return {'started':True,'target':target,'format':1}

if __name__=='__main__':
    try:
        if len(sys.argv)==1:
            print(json.dumps(snapshot(),separators=(',',':')))
        elif len(sys.argv)==3 and sys.argv[1]=='start':
            print(json.dumps(start(sys.argv[2]),separators=(',',':')))
        else:
            raise ValueError('Unsupported profiles request')
    except Exception:
        print(json.dumps({'format':1,'error':'Configuration profiles are unavailable.'},separators=(',',':')))
        sys.exit(1)
