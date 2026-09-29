#!/usr/bin/env python3
import hashlib,os,tarfile,tempfile,unittest
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
cli=load('admin_cli')
approve=load('approve_cli')

class AdminCli(unittest.TestCase):
    def test_approve_list_and_start(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root)
            releases=root/'cli'
            version='2026.09.29-abcdef0'
            binary=root/'payload'/version;binary.mkdir(parents=True)
            exe=binary/'cursor-agent'
            exe.write_text('#!/bin/sh\necho '+version+'\n');os.chmod(exe,0o755)
            archive=root/'cursor.tar.gz'
            with tarfile.open(archive,'w:gz') as tar:tar.add(binary,arcname=version)
            sha=hashlib.sha256(archive.read_bytes()).hexdigest()
            meta=approve.approve(archive,sha,version,notes='fixture',releases=releases,owner=os.getuid())
            self.assertEqual(meta['id'],'cursor_'+version)
            inventory=cli.list_approvals(releases,owner=os.getuid())
            self.assertEqual(len(inventory['items']),1)
            self.assertEqual(inventory['items'][0]['adapter'],'cursor')
            started=[]
            result=cli.start_install(
                meta['id'],
                list_fn=lambda:cli.list_approvals(releases,owner=os.getuid()),
                start=started.append,
                configured=lambda:True,
            )
            self.assertTrue(result['started'])
            self.assertEqual(started,['agentd-cli-install@'+meta['id']+'.service'])
            with self.assertRaises(ValueError):
                cli.start_install(
                    'cursor_1999.01.01-deadbee',
                    list_fn=lambda:cli.list_approvals(releases,owner=os.getuid()),
                    start=started.append,
                    configured=lambda:True,
                )

if __name__=='__main__':
    unittest.main()
