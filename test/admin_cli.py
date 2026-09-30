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
    def approve_fixture(self,adapter,version,binary,releases,root):
        payload=root/'payload'/adapter/version;payload.mkdir(parents=True)
        exe=payload/binary
        exe.write_text('#!/bin/sh\necho '+version+'\n');os.chmod(exe,0o755)
        archive=root/(adapter+'.tar.gz')
        with tarfile.open(archive,'w:gz') as tar:tar.add(payload,arcname=version)
        sha=hashlib.sha256(archive.read_bytes()).hexdigest()
        return approve.approve(archive,sha,version,adapter=adapter,notes='fixture',releases=releases,owner=os.getuid())

    def test_approve_list_and_start_cursor(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);releases=root/'cli'
            version='2026.09.29-abcdef0'
            meta=self.approve_fixture('cursor',version,'cursor-agent',releases,root)
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

    def test_approve_claude_and_codex(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);releases=root/'cli'
            claude=self.approve_fixture('claude','2.1.283','claude',releases,root)
            codex=self.approve_fixture('codex','0.157.1','codex',releases,root)
            self.assertEqual(claude['id'],'claude_2.1.283')
            self.assertEqual(codex['id'],'codex_0.157.1')
            inventory=cli.list_approvals(releases,owner=os.getuid())
            adapters={item['adapter'] for item in inventory['items']}
            self.assertEqual(adapters,{'claude','codex'})
            started=[]
            cli.start_install(
                claude['id'],
                list_fn=lambda:cli.list_approvals(releases,owner=os.getuid()),
                start=started.append,
                configured=lambda:True,
            )
            self.assertEqual(started,['agentd-cli-install@claude_2.1.283.service'])

if __name__=='__main__':
    unittest.main()
