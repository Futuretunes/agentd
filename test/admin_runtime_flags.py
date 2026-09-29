#!/usr/bin/env python3
import importlib.util,os,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_runtime_flags',ROOT/'scripts/admin_runtime_flags.py')
flags=importlib.util.module_from_spec(spec);spec.loader.exec_module(flags)

class RuntimeFlags(unittest.TestCase):
    def test_snapshot_and_apply(self):
        with tempfile.TemporaryDirectory() as root:
            path=Path(root)/'agentd.env'
            path.write_text('AGENTD_REPO=/srv/agentd/repos/project\nAGENTD_STRICT_WORKERS=0\n')
            value=flags.snapshot(path)
            self.assertFalse(value['flags']['strictWorkers'])
            self.assertEqual(len(value['fingerprint']),64)
            with self.assertRaises(ValueError):
                flags.apply_flags({'strictWorkers':False,'credentialRenewal':True,'codexChat':False},path,expected_uid=os.getuid())
            updated=flags.apply_flags({'strictWorkers':True,'credentialRenewal':True,'codexChat':False},path,expected_uid=os.getuid())
            text=path.read_text()
            self.assertIn('AGENTD_REPO=/srv/agentd/repos/project',text)
            self.assertIn('AGENTD_STRICT_WORKERS=1',text)
            self.assertIn('AGENTD_CREDENTIAL_RENEWAL=1',text)
            self.assertTrue(updated['flags']['strictWorkers'])
            self.assertTrue(updated['flags']['credentialRenewal'])
            self.assertNotEqual(updated['fingerprint'],value['fingerprint'])

if __name__=='__main__':
    unittest.main()
