#!/usr/bin/env python3
"""Approve a reviewed Cursor agent binary archive for in-app installation.

Run as root after independent review. The archive is verified against its
independently recorded SHA-256 and copied, with an approval record, into the
root-only approved-CLI directory. An existing approval for the same id is never
replaced with different content.

Archive layout: a single top-level directory named exactly the Cursor version,
containing an executable named cursor-agent (and any supporting files).
"""
import argparse,hashlib,json,os,re,shutil,tarfile,sys
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import admin_cli as cli

CURSOR_VERSION=cli.CURSOR_VERSION

def sha256_file(path):
    digest=hashlib.sha256()
    with path.open('rb') as handle:
        while True:
            chunk=handle.read(1024*1024)
            if not chunk:break
            digest.update(chunk)
    return digest.hexdigest()

def verify_archive(archive,sha256,version):
    if sha256_file(archive)!=sha256:raise ValueError('Archive checksum mismatch')
    with tarfile.open(archive,'r:gz') as tar:
        members=tar.getmembers()
        if not members:raise ValueError('Empty archive')
        names=[member.name for member in members]
        if any(name.startswith('/') or '..' in Path(name).parts for name in names):
            raise ValueError('Archive paths must be relative')
        top={name.split('/',1)[0] for name in names if name}
        if top!={version}:raise ValueError('Archive must contain only the version directory')
        binary=f'{version}/cursor-agent'
        member=tar.getmember(binary)
        if not member.isfile() or member.size<1 or member.size>200_000_000:
            raise ValueError('cursor-agent binary is missing or invalid')
        if (member.mode & 0o111)==0:raise ValueError('cursor-agent must be executable in the archive')
    return True

def approve(archive,sha256,version,notes='',releases=cli.RELEASES,owner=0):
    if not CURSOR_VERSION.fullmatch(version):raise ValueError('Invalid Cursor version')
    if len(notes)>600:raise ValueError('Notes are limited to 600 characters')
    if not re.fullmatch(r'[0-9a-f]{64}',sha256):raise ValueError('Invalid checksum')
    archive=Path(archive)
    verify_archive(archive,sha256,version)
    key=f'cursor_{version}'
    releases.mkdir(mode=0o700,exist_ok=True)
    info=releases.lstat()
    if releases.is_symlink() or info.st_uid!=owner or info.st_mode&0o077:
        raise ValueError('Approved CLI directory must be root-only')
    record,target=releases/(key+'.json'),releases/(key+'.tar.gz')
    if record.exists() or target.exists():
        existing=json.loads(record.read_text()) if record.exists() else {}
        if existing.get('sha256')==sha256 and target.exists():return existing
        raise ValueError('A different approval for this CLI version already exists')
    temporary=target.with_suffix('.tmp');shutil.copyfile(archive,temporary);temporary.chmod(0o600);temporary.replace(target)
    value={'format':1,'id':key,'adapter':'cursor','version':version,'sha256':sha256,
           'notes':notes,'matchesTestedPin':False,
           'approvedAt':datetime.now(timezone.utc).isoformat(timespec='seconds')}
    temporary=record.with_suffix('.tmp');temporary.write_text(json.dumps(value,indent=2)+'\n');temporary.chmod(0o600);temporary.replace(record)
    cli.approved(key,releases,owner)
    return value

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive',required=True)
    parser.add_argument('--sha256',required=True)
    parser.add_argument('--version',required=True)
    parser.add_argument('--notes',default='')
    a=parser.parse_args()
    try:
        if os.geteuid()!=0:raise ValueError('Administrator required')
        print(json.dumps(approve(Path(a.archive),a.sha256,a.version,a.notes)))
    except Exception as error:
        print(str(error),file=sys.stderr);sys.exit(1)
