#!/usr/bin/env python3
"""List and start installation of operator-approved native CLI binaries.

Cursor, Claude and Codex approvals live under /var/lib/agentd-cli. Each install
writes under /opt/<root>/<version> and updates a managed symlink in the service
user's ~/.local/bin. Account profiles are never touched.
"""
import json,os,re,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update

CONFIG=Path('/etc/agentd/update.json')
RELEASES=Path('/var/lib/agentd-cli')
ADAPTERS={
    'cursor':{
        'id':re.compile(r'cursor_[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}'),
        'version':re.compile(r'[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}'),
        'binary':'cursor-agent',
        'link':'cursor-agent',
        'root':Path('/opt/cursor-agent'),
        'prefix':'cursor_',
    },
    'claude':{
        'id':re.compile(r'claude_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}'),
        'version':re.compile(r'[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}'),
        'binary':'claude',
        'link':'claude',
        'root':Path('/opt/claude-code'),
        'prefix':'claude_',
    },
    'codex':{
        'id':re.compile(r'codex_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}'),
        'version':re.compile(r'[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}'),
        'binary':'codex',
        'link':'codex',
        'root':Path('/opt/codex'),
        'prefix':'codex_',
    },
}
ID_KEY=re.compile(r'(?:cursor_[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}|claude_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|codex_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4})')
SHA=re.compile(r'[0-9a-f]{64}')

def adapter_for(key):
    if not isinstance(key,str) or not ID_KEY.fullmatch(key):raise ValueError('Invalid CLI approval id')
    for name,spec in ADAPTERS.items():
        if spec['id'].fullmatch(key):return name,spec
    raise ValueError('Invalid CLI approval id')

def root_file(path,owner=0):
    info=path.lstat()
    if path.is_symlink() or not path.is_file() or info.st_uid!=owner or info.st_mode&0o022:
        raise ValueError('Approved CLI files must be root-owned regular files')

def public_item(meta):
    return {
        'id':meta['id'],
        'adapter':meta['adapter'],
        'version':meta['version'],
        'notes':str(meta.get('notes') or '')[:200],
        'approvedAt':meta.get('approvedAt'),
        'matchesTestedPin':bool(meta.get('matchesTestedPin')),
    }

def approved(key,releases=RELEASES,owner=0):
    adapter,spec=adapter_for(key)
    record,archive=releases/(key+'.json'),releases/(key+'.tar.gz')
    root_file(record,owner);root_file(archive,owner)
    meta=json.loads(record.read_text())
    if (meta.get('format')!=1 or meta.get('id')!=key or meta.get('adapter')!=adapter
            or not spec['version'].fullmatch(str(meta.get('version','')))
            or not SHA.fullmatch(str(meta.get('sha256','')))):
        raise ValueError('Invalid CLI approval record')
    return meta,archive

def list_approvals(releases=RELEASES,owner=0):
    if not releases.is_dir() or releases.is_symlink():
        return {'format':1,'items':[],'running':False}
    info=releases.lstat()
    if info.st_uid!=owner or info.st_mode&0o077:
        raise ValueError('Approved CLI directory must be root-only')
    items=[]
    for path in sorted(releases.glob('*.json')):
        try:
            meta,_=approved(path.stem,releases,owner)
            items.append(public_item(meta))
        except ValueError:
            continue
    return {'format':1,'items':items,'running':running()}

def running(patterns=('agentd-cli-install@*',)):
    try:
        text=subprocess.run(['/usr/bin/systemctl','list-units',*patterns,'--state=running,activating','--no-legend','--plain'],
                            check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5).stdout
        return bool(text.strip())
    except (OSError,subprocess.SubprocessError):
        return False

def start_install(key,list_fn=list_approvals,start=None,configured=None):
    if not isinstance(key,str) or not ID_KEY.fullmatch(key):raise ValueError('Invalid CLI approval id')
    if running():raise ValueError('A CLI install is already running')
    inventory=list_fn()
    if not any(item['id']==key for item in inventory['items']):
        raise ValueError('CLI approval is not available')
    if configured is None:
        def configured():
            c=update.config(CONFIG)
            if not c.get('cliUnit'):raise ValueError('CLI install helper is not enabled')
            return True
    configured()
    if start is None:
        def start(unit):
            subprocess.run(['/usr/bin/systemctl','start','--no-block',unit],check=True,timeout=10,
                           stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env={'PATH':'/usr/bin:/bin','LANG':'C'})
    start(f'agentd-cli-install@{key}.service')
    return {'started':True,'id':key,'format':1}

if __name__=='__main__':
    try:
        if len(sys.argv)==1:
            print(json.dumps(list_approvals(),separators=(',',':')))
        elif len(sys.argv)==3 and sys.argv[1]=='install':
            print(json.dumps(start_install(sys.argv[2]),separators=(',',':')))
        else:
            raise ValueError('Unsupported CLI request')
    except Exception:
        print(json.dumps({'format':1,'error':'Native CLI install is unavailable.'},separators=(',',':')))
        sys.exit(1)
