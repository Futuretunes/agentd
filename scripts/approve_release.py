#!/usr/bin/env python3
"""Approve a reviewed release archive so it can be installed from Settings > Updates.

Run as root after independent review and green CI. The archive is verified against
its independently recorded SHA-256 and copied, with an approval record, into the
root-only approved-releases directory. An existing approval for the same version is
never replaced with different content.
"""
import argparse,json,os,shutil,sys
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import release
import run_approved_update as job

def approve(archive,sha256,notes,releases=job.RELEASES,owner=0):
    manifest,_=release.verify(archive,sha256);version=manifest['version'];job.version_key(version)
    if len(notes)>600:raise ValueError('Release notes are limited to 600 characters')
    releases.mkdir(mode=0o700,exist_ok=True);info=releases.lstat()
    if releases.is_symlink() or info.st_uid!=owner or info.st_mode&0o077:raise ValueError('Approved-releases directory must be owner-only')
    record,target=releases/(version+'.json'),releases/(version+'.tar.gz')
    if record.exists() or target.exists():
        existing=json.loads(record.read_text()) if record.exists() else {}
        if existing.get('sha256')==sha256 and target.exists():return existing
        raise ValueError('A different approval for this version already exists')
    temporary=target.with_suffix('.tmp');shutil.copyfile(archive,temporary);temporary.chmod(0o600);temporary.replace(target)
    value={'format':1,'version':version,'revision':manifest['revision'],'sha256':sha256,'taskSchemaVersion':manifest['taskSchemaVersion'],
           'notes':notes,'approvedAt':datetime.now(timezone.utc).isoformat(timespec='seconds')}
    temporary=record.with_suffix('.tmp');temporary.write_text(json.dumps(value,indent=2)+'\n');temporary.chmod(0o600);temporary.replace(record)
    # Read back through the same checks the updater applies.
    job.approved(version,releases,owner);return value

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive',required=True);parser.add_argument('--sha256',required=True);parser.add_argument('--notes',default='')
    a=parser.parse_args()
    try:
        if os.geteuid()!=0:raise ValueError('Administrator required')
        print(json.dumps(approve(Path(a.archive),a.sha256,a.notes)))
    except Exception as error:print(str(error),file=sys.stderr);sys.exit(1)
