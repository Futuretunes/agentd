#!/usr/bin/env python3
"""Build/verify a deterministic, source-only release from an exact Git commit."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile

ROOTS = {'src', 'public', 'scripts', 'test', 'docs', 'deploy'}
FILES = {'package.json', 'package-lock.json', 'tsconfig.json', 'README.md', 'LICENSE', 'AGENTS.md', 'CLAUDE.md', '.env.example'}
LIMIT = 64 * 1024 * 1024

def digest(data):
    return hashlib.sha256(data).hexdigest()

def allowed(name):
    p = PurePosixPath(name)
    return str(p) == name and not p.is_absolute() and '..' not in p.parts and (name in FILES or len(p.parts) > 1 and p.parts[0] in ROOTS)

def build(repo, revision, output):
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('Supply an exact 40-character commit SHA')
    def git(*args):
        return subprocess.check_output(['git', '-C', str(repo), *args])
    if git('rev-parse', revision + '^{commit}').decode().strip() != revision:
        raise ValueError('Not a commit')
    files = {}
    for entry in git('ls-tree', '-rz', revision).split(b'\0'):
        if not entry:
            continue
        info, raw_name = entry.split(b'\t', 1)
        name = raw_name.decode('utf-8')
        if not allowed(name):
            continue
        mode, kind, sha = info.decode().split()
        if kind != 'blob' or mode not in ('100644', '100755'):
            raise ValueError('Release refuses links/submodules: ' + name)
        files[name] = git('cat-file', 'blob', sha)
    package = json.loads(files['package.json'])
    schema = re.search(rb'export const TASK_SCHEMA_VERSION = (\d+);', files['src/task-database.ts'])
    manifest = {'format': 1, 'revision': revision, 'version': package['version'], 'taskSchemaVersion': int(schema[1]),
                'files': {name: digest(data) for name, data in sorted(files.items())}}
    files['release-manifest.json'] = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode()
    with Path(output).open('xb') as stream:
        with gzip.GzipFile(filename='', mode='wb', fileobj=stream, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode='w', format=tarfile.USTAR_FORMAT) as archive:
                for name, data in sorted(files.items()):
                    info = tarfile.TarInfo(name)
                    info.size, info.mode, info.mtime = len(data), 0o644, 0
                    archive.addfile(info, io.BytesIO(data))
    return digest(Path(output).read_bytes())

def verify(archive_path, expected_hash):
    if not re.fullmatch(r'[0-9a-f]{64}', expected_hash):
        raise ValueError('An independently recorded SHA-256 is required')
    archive_path = Path(archive_path)
    if archive_path.stat().st_size > LIMIT:
        raise ValueError('Release archive is too large')
    data = archive_path.read_bytes()
    if digest(data) != expected_hash:
        raise ValueError('Release archive hash mismatch')
    files, total = {}, 0
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        for member in archive:
            name = member.name
            total += member.size
            if total > LIMIT or len(files) >= 4096 or member.size < 0:
                raise ValueError('Release exceeds extraction limits')
            if not member.isfile() or name in files or not (allowed(name) or name == 'release-manifest.json'):
                raise ValueError('Invalid release member')
            files[name] = archive.extractfile(member).read()
    manifest = json.loads(files.pop('release-manifest.json'))
    if manifest.get('format') != 1 or not re.fullmatch(r'[0-9a-f]{40}', manifest.get('revision', '')):
        raise ValueError('Unsupported release manifest')
    if manifest['files'] != {name: digest(data) for name, data in files.items()}:
        raise ValueError('Release contents differ from manifest')
    required = FILES | {'src/server.ts', 'src/runner.ts', 'src/task-database.ts', 'src/mobile.ts', 'public/index.html', 'deploy/agentd.service', 'scripts/test-isolation-ci.mjs'}
    if not required <= files.keys():
        raise ValueError('Incomplete release')
    if json.loads(files['package.json'])['version'] != manifest['version']:
        raise ValueError('Release version mismatch')
    if int(re.search(rb'export const TASK_SCHEMA_VERSION = (\d+);', files['src/task-database.ts'])[1]) != manifest['taskSchemaVersion']:
        raise ValueError('Release schema mismatch')
    return manifest, files

def extract(files, manifest, target):
    target = Path(target)
    target.mkdir(mode=0o755)  # Must not already exist, including symlinks.
    for name, data in files.items():
        path = target / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        path.chmod(0o644)
    (target / 'release-manifest.json').write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    b = sub.add_parser('build'); b.add_argument('--repo', default='.'); b.add_argument('--revision', required=True); b.add_argument('--output', required=True)
    v = sub.add_parser('verify'); v.add_argument('archive'); v.add_argument('--sha256', required=True); v.add_argument('--extract')
    args = parser.parse_args()
    if args.command == 'build':
        print(build(args.repo, args.revision, args.output))
    else:
        manifest, files = verify(args.archive, args.sha256)
        if args.extract: extract(files, manifest, args.extract)
        print(json.dumps({k: v for k, v in manifest.items() if k != 'files'}))
