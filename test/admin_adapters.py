#!/usr/bin/env python3
import importlib.util,os,tempfile,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_adapters',ROOT/'scripts/admin_adapters.py')
adapters=importlib.util.module_from_spec(spec);spec.loader.exec_module(adapters)

class AdaptersPolicyTest(unittest.TestCase):
    def test_snapshot_and_apply_preserve_unrelated_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'agentd.env'
            path.write_text('AGENTD_REPO=/srv/agentd/repos/project\nAGENTD_ENABLED_ADAPTERS=claude\nAGENTD_EDITING=1\nAGENTD_EDIT_ADAPTERS=claude\n')
            path.chmod(0o640)
            value=adapters.snapshot(path)
            self.assertEqual(value['enabled'],['claude'])
            self.assertEqual(len(value['fingerprint']),64)
            updated=adapters.apply_policy(['claude','cursor'],True,['claude'],path,expected_uid=os.getuid())
            text=path.read_text()
            self.assertIn('AGENTD_REPO=/srv/agentd/repos/project',text)
            self.assertEqual(updated['enabled'],['claude','cursor'])
            self.assertEqual(updated['editAdapters'],['claude'])
            self.assertNotEqual(updated['fingerprint'],value['fingerprint'])
            with self.assertRaises(ValueError):adapters.apply_policy(['nope'],False,[],path,expected_uid=os.getuid())
            with self.assertRaises(ValueError):adapters.apply_policy([],False,[],path,expected_uid=os.getuid())

if __name__=='__main__':unittest.main()
