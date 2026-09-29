#!/usr/bin/env python3
"""Harden the separate web gateway unit (defence in depth; the runner is not restarted)."""
import argparse,fcntl,json,os,ssl,subprocess,sys,tempfile,time,urllib.error,urllib.request
from pathlib import Path
import update
from separate_gateway import atomic
PROFILE='gateway-hardening-v1'
DROPIN='110-gateway-hardening.conf'
# Node needs writable-executable memory for its JIT, so MemoryDenyWriteExecute is
# deliberately absent; PrivateUsers would break group access to the gateway socket.
SETTINGS=[('LockPersonality','yes'),('RestrictRealtime','yes'),('RestrictNamespaces','yes'),('ProtectClock','yes'),
 ('ProtectKernelLogs','yes'),('ProtectHostname','yes'),('ProtectProc','invisible'),('ProcSubset','pid'),('RemoveIPC','yes'),
 ('SystemCallArchitectures','native'),('SystemCallFilter','@system-service'),
 ('SystemCallFilter','~@privileged @mount @debug @cpu-emulation @obsolete @raw-io @reboot @swap @clock @module'),
 ('SystemCallErrorNumber','EPERM')]
# How systemctl show reports the settings above.
EXPECTED={'LockPersonality':'yes','RestrictRealtime':'yes','RestrictNamespaces':'yes','ProtectClock':'yes','ProtectKernelLogs':'yes',
 'ProtectHostname':'yes','ProtectProc':'invisible','ProcSubset':'pid','RemoveIPC':'yes','SystemCallArchitectures':'native','SystemCallErrorNumber':'1'}

def dropin_text():return '[Service]\n'+''.join(k+'='+v+'\n' for k,v in SETTINGS)
def dropin(c):return Path('/etc/systemd/system')/(c['mobileUnit']+'.d')/DROPIN

def verify(c):
    names=[*EXPECTED,'SystemCallFilter']
    actual=dict(line.split('=',1) for line in update.capture(['systemctl','show',c['mobileUnit'],*['--property='+n for n in names]]).splitlines() if '=' in line)
    if any(actual.get(k)!=v for k,v in EXPECTED.items()):raise ValueError('Gateway hardening mismatch')
    # An allowlist is reported without a leading "~"; an empty filter means none applied.
    syscalls=actual.get('SystemCallFilter','')
    if not syscalls or syscalls.startswith('~') or {'mount','ptrace','reboot'}&set(syscalls.split()):raise ValueError('Gateway system-call filter not applied')

def smoke(c,timeout=30):
    # The gateway must serve its page and answer a (deliberately wrong) sign-in over TLS.
    mobile=json.loads(Path(dict(line.split('=',1) for line in update.capture(['systemctl','show',c['mobileUnit'],'--property=Environment']).strip().removeprefix('Environment=').split() if '=' in line).get('AGENTD_MOBILE_CONFIG','/etc/agentd/mobile.json')).read_text())
    base='https://'+mobile.get('host','127.0.0.1')+':'+str(mobile.get('port',8788))
    context=ssl.create_default_context();context.check_hostname=False;context.verify_mode=ssl.CERT_NONE
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPSHandler(context=context))
    deadline=time.time()+timeout
    while True:
        try:
            with opener.open(base+'/',timeout=3) as response:
                if response.status!=200:raise ValueError('Gateway page unavailable')
            request=urllib.request.Request(base+'/api/login',data=b'{"key":"agentd-hardening-smoke-test"}',headers={'Content-Type':'application/json','Origin':mobile.get('origin','')},method='POST')
            try:opener.open(request,timeout=3);raise ValueError('Gateway accepted an invalid access key')
            except urllib.error.HTTPError as error:
                if error.code not in (401,429):raise ValueError('Gateway sign-in path failed')
            return
        except (OSError,ValueError) as error:
            if isinstance(error,ValueError) or time.time()>deadline:raise ValueError('Gateway smoke test failed: '+str(error))
            time.sleep(1)

def apply(c,config_path,previous,current,backup):
    path=dropin(c);old_config=config_path.read_bytes();record=Path(c['deployment'])/'installed.json';old_record=record.read_bytes()
    (backup/'update.json').write_bytes(old_config);(backup/'installed.json').write_bytes(old_record)
    new=dict(c,gatewayHardening=PROFILE);journal=Path(c['deployment'])/'gateway-hardening-pending.json';atomic(journal,json.dumps({'backup':str(backup)}).encode());changed=False
    try:
        update.run(['systemctl','stop',c['mobileUnit']])
        if update.inventory(c)!=current:raise ValueError('Configuration drift during gateway hardening')
        changed=True
        path.parent.mkdir(exist_ok=True,mode=0o755);atomic(path,dropin_text().encode(),0o644)
        update.run(['systemctl','daemon-reload']);verify(new);target=update.inventory(new)
        update.run(['systemctl','start',c['mobileUnit']]);smoke(new);update.run(['systemctl','is-active','--quiet',c['runnerUnit'],c['mobileUnit']])
        if update.inventory(new)!=target:raise ValueError('Gateway configuration drift during restart')
        atomic(config_path,(json.dumps(new,indent=2)+'\n').encode());atomic(record,(json.dumps(dict(previous,configuration=target),indent=2)+'\n').encode());journal.unlink()
        print('Gateway hardening installed and verified (settings, TLS page and sign-in path).')
        print('Configuration rollback backup: '+str(backup))
    except BaseException:
        if changed:
            update.run(['systemctl','stop',c['mobileUnit']]);path.unlink(missing_ok=True)
            atomic(config_path,old_config);atomic(record,old_record);update.run(['systemctl','daemon-reload'])
        update.run(['systemctl','start',c['mobileUnit']])
        # Nothing changed before the drop-in was written; a rolled-back change keeps its journal for review.
        if not changed:journal.unlink(missing_ok=True)
        raise

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True);a=parser.parse_args()
    if os.geteuid()!=0:raise ValueError('Administrator required')
    path=update.canonical(a.config);c=update.config(path)
    if not c.get('gatewayUser') or not c.get('resourceProfile'):raise ValueError('Separate gateway and resource profile required first')
    if c.get('gatewayHardening'):verify(c);smoke(c);print('Gateway hardening already verified.');return
    root=Path(c['deployment']);s=root.stat()
    if root.is_symlink() or s.st_uid!=0 or s.st_mode&0o077:raise ValueError('Invalid private deployment directory')
    with (root/'update.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if any(root.glob('*pending.json')):raise ValueError('Resolve pending recovery before gateway changes')
        previous=json.loads((root/'installed.json').read_text());current=update.inventory(c)
        if current!=previous['configuration']:raise ValueError('Installed configuration drifted')
        installed=json.loads((Path(c['app'])/'release-manifest.json').read_text())
        if installed!=previous['release'] or 'scripts/apply_gateway_hardening.py' not in installed.get('files',{}):raise ValueError('Install a release containing this script first')
        if dropin(c).exists() or dropin(c).is_symlink():raise ValueError('Gateway hardening override already exists; review it first')
        backup=Path(tempfile.mkdtemp(prefix='agentd-gateway-hardening-backup-',dir=Path(c['app']).parent));apply(c,path,previous,current,backup)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('Gateway hardening failed; inspect local logs.' if isinstance(e,subprocess.CalledProcessError) else str(e),file=sys.stderr);sys.exit(1)
