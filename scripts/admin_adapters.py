#!/usr/bin/env python3
"""Read or update allowlisted agent adapter policy keys in /etc/agentd/agentd.env."""
import hashlib,json,os,sys
from pathlib import Path

ENV_PATH=Path('/etc/agentd/agentd.env')
ALLOWED={'claude','codex','cursor'}

def parse(text):
    values={}
    for line in text.splitlines():
        if not line or line.lstrip().startswith('#') or '=' not in line:continue
        key,value=line.split('=',1)
        values[key]=value
    return values

def adapters(value):
    items=[item for item in str(value or '').split(',') if item]
    if any(item not in ALLOWED for item in items):raise ValueError('Unsupported adapter')
    if len(set(items))!=len(items):raise ValueError('Duplicate adapter')
    return items

def fingerprint(enabled,editing,edit_adapters):
    payload=json.dumps({'enabled':enabled,'editing':bool(editing),'editAdapters':edit_adapters},separators=(',',':'),sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()

def snapshot(path=ENV_PATH):
    text=path.read_text() if path.is_file() else ''
    values=parse(text)
    enabled=adapters(values.get('AGENTD_ENABLED_ADAPTERS','claude'))
    editing=values.get('AGENTD_EDITING','0') in ('1','true','True','yes')
    edit=adapters(values.get('AGENTD_EDIT_ADAPTERS','')) if editing else []
    if any(item not in enabled for item in edit):raise ValueError('Edit adapters must be enabled')
    return {
        'format':1,
        'enabled':enabled,
        'editing':editing,
        'editAdapters':edit,
        'supported':sorted(ALLOWED),
        'fingerprint':fingerprint(enabled,editing,edit),
        'requiresRestart':True,
    }

def render(text,enabled,editing,edit_adapters):
    lines=text.splitlines();seen=set();out=[]
    replacements={
        'AGENTD_ENABLED_ADAPTERS':','.join(enabled),
        'AGENTD_EDITING':'1' if editing else '0',
        'AGENTD_EDIT_ADAPTERS':','.join(edit_adapters),
    }
    for line in lines:
        if line and not line.lstrip().startswith('#') and '=' in line:
            key=line.split('=',1)[0]
            if key in replacements:
                out.append(f'{key}={replacements[key]}');seen.add(key);continue
        out.append(line)
    for key,value in replacements.items():
        if key not in seen:out.append(f'{key}={value}')
    return '\n'.join(out)+('\n' if out else '')

def apply_policy(enabled,editing,edit_adapters,path=ENV_PATH,expected_uid=0):
    enabled=adapters(','.join(enabled) if isinstance(enabled,list) else enabled)
    if not enabled:raise ValueError('At least one adapter must stay enabled')
    edit_adapters=adapters(','.join(edit_adapters) if isinstance(edit_adapters,list) else (edit_adapters or ''))
    editing=bool(editing)
    if editing and not edit_adapters:raise ValueError('Choose at least one edit adapter when editing is enabled')
    if not editing:edit_adapters=[]
    if any(item not in enabled for item in edit_adapters):raise ValueError('Edit adapters must be enabled')
    if path.is_symlink() or not path.is_file():raise ValueError('Managed environment file is missing')
    info=path.lstat()
    if info.st_uid!=expected_uid or info.st_size>65536:raise ValueError('Invalid environment file')
    text=path.read_text();body=render(text,enabled,editing,edit_adapters)
    temporary=path.with_name(f'.agentd.env.{os.getpid()}.tmp')
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
            print(json.dumps(apply_policy(request['enabled'],request.get('editing',False),request.get('editAdapters',[])),separators=(',',':')))
        else:
            raise ValueError('Unsupported adapters request')
    except Exception:
        print(json.dumps({'format':1,'error':'Adapter policy is unavailable.'},separators=(',',':')));sys.exit(1)
