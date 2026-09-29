#!/usr/bin/env python3
import importlib.util,os,subprocess,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_tls',ROOT/'scripts/admin_tls.py')
tls=importlib.util.module_from_spec(spec);spec.loader.exec_module(tls)

class AdminTls(unittest.TestCase):
    def test_replace_and_reject(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root)
            cert,key=root/'tls.crt',root/'tls.key'
            subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(key),'-out',str(cert),'-days','1','-subj','/CN=fixture'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            os.chmod(cert,0o640);os.chmod(key,0o640)
            before=tls.metadata(cert)
            self.assertIsNotNone(before['fingerprintSha256'])
            other_key=root/'other.key'
            subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(other_key),'-out',str(root/'other.crt'),'-days','1','-subj','/CN=other'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            with self.assertRaises(ValueError):
                tls.replace(cert.read_text(),other_key.read_text(),cert,key,expected_uid=os.getuid())
            # Replace with a fresh matching pair
            new_cert,new_key=root/'new.crt',root/'new.key'
            subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(new_key),'-out',str(new_cert),'-days','2','-subj','/CN=replaced'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            updated=tls.replace(new_cert.read_text(),new_key.read_text(),cert,key,expected_uid=os.getuid())
            self.assertTrue(updated['replaced'])
            self.assertTrue('replaced' in (updated['subject'] or '').lower() or 'CN=replaced' in (updated['subject'] or '') or 'CN = replaced' in (updated['subject'] or ''))
            self.assertNotEqual(updated['fingerprintSha256'],before['fingerprintSha256'])
            self.assertEqual(cert.stat().st_mode&0o777,0o640)

if __name__=='__main__':
    unittest.main()
