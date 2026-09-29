#!/usr/bin/env python3
"""Read or update allowlisted boolean runtime flags in /etc/agentd/agentd.env."""
import hashlib,json,os,sys
from pathlib import Path

ENV_PATH=Path('/etc/agentd/agentd.env')
FLAGS=('AGENTD_STRICT_WORKERS','AGENTD_CREDENTIAL_RENEWAL','AGENTD_CODEX_CHAT')
LABELS={
    'AGENTD_STRICT_WORKERS':'strictWorkers',
    'AGENTD_CREDENTIAL_RENEWAL':'credentialRenewal',
    'AGENTD_CODEX_CHAT':'codexChat',
}

def parse(text):
    values={}
    for line in text.splitlines():
        if not line or line.lstrip().startswith('#') or '=' not in line:continue
        key,value=line.split('=',1)
        values[key]=value
    return values

def truthy(value):
    return str(value or '0') in ('1','true','True','yes')

def fingerprint(flags):
    payload=json.dumps(flags,separators=(',',':'),sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()

def snapshot(path=ENV_PATH):
    text=path.read_text() if path.is_file() else ''
    values=parse(text)
    flags={LABELS[key]:truthy(values.get(key,'0')) for key in FLAGS}
    # Credential renewal and Codex chat require hardened workers.
    if (flags['credentialRenewal'] or flags['codexChat']) and not flags['strictWorkers']:
        raise ValueError('Hardened workers are required for credential renewal and Codex chat')
    return {
        'format':1,
        'flags':flags,
        'fingerprint':fingerprint(flags),
        'requiresRestart':True,
    }

def render(text,flags):
    lines=text.splitlines();seen=set();out=[]
    replacements={key:('1' if flags[LABELS[key]] else '0') for key in FLAGS}
    for line in lines:
        if line and not line.lstrip().startswith('#') and '=' in line:
            key=line.split('=',1)[0]
            if key in replacements:
                out.append(f'{key}={replacements[key]}');seen.add(key);continue
        out.append(line)
    for key,value in replacements.items():
        if key not in seen:out.append(f'{key}={value}')
    return '\n'.join(out)+('\n' if out else '')

def apply_flags(flags,path=ENV_PATH,expected_uid=0):
    if not isinstance(flags,dict):raise ValueError('Invalid runtime flags')
    normalized={
        'strictWorkers':bool(flags.get('strictWorkers')),
        'credentialRenewal':bool(flags.get('credentialRenewal')),
        'codexChat':bool(flags.get('codexChat')),
    }
    if (normalized['credentialRenewal'] or normalized['codexChat']) and not normalized['strictWorkers']:
        raise ValueError('Hardened workers are required for credential renewal and Codex chat')
    if path.is_symlink() or not path.is_file():raise ValueError('Managed environment file is missing')
    info=path.lstat()
    if info.st_uid!=expected_uid or info.st_size>65536:raise ValueError('Invalid environment file')
    text=path.read_text();body=render(text,normalized)
    temporary=path.with_name(f'.agentd.env.flags.{os.getpid()}.tmp')
    try:
        temporary.write_text(body);os.chown(temporary,info.st_uid,info.st_gid);os.chmod(temporary,info.st_mode&0o777)
        temporary.replace(path)
    finally:
        try:temporary.unlink()
        except FileNotFoundError:pass
    return snapshot(path)

if __name__=='__main__':
    try:
        if len(sys.argv)==1:
            print(json.dumps(snapshot(),separators=(',',':')))
        elif len(sys.argv)==2 and sys.argv[1].startswith('{'):
            request=json.loads(sys.argv[1])
            print(json.dumps(apply_flags(request.get('flags',request)),separators=(',',':')))
        else:
            raise ValueError('Unsupported runtime flags request')
    except Exception:
        print(json.dumps({'format':1,'error':'Runtime flags are unavailable.'},separators=(',',':')));sys.exit(1)
