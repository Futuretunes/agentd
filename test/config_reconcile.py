import hashlib, json, os, sys, tempfile, unittest
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import update
import reconcile_configuration as reconcile

class ConfigurationFingerprintTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'mobile.json'
        self.value={'host':'127.0.0.1','port':8788,'accessHash':'a'*64}
        self.write(self.value);os.chmod(self.path,0o640)
    def tearDown(self):self.tmp.cleanup()
    def write(self,value):
        mode=self.path.stat().st_mode&0o777 if self.path.exists() else None
        self.path.write_text(json.dumps(value))
        if mode is not None:os.chmod(self.path,mode)

    def test_access_key_rotation_is_not_drift_but_other_changes_are(self):
        before=update.config_fingerprint(str(self.path))
        self.write(dict(self.value,accessHash='b'*64));self.assertEqual(update.config_fingerprint(str(self.path)),before)
        self.write(dict(self.value,port=9999));self.assertNotEqual(update.config_fingerprint(str(self.path)),before)
        self.write(dict(self.value,accessHash='not-a-digest'));self.assertNotEqual(update.config_fingerprint(str(self.path)),before)
        self.write(self.value);self.assertEqual(update.config_fingerprint(str(self.path)),before)
        os.chmod(self.path,0o600);self.assertNotEqual(update.config_fingerprint(str(self.path)),before)

    def test_non_json_files_bind_exact_bytes(self):
        pem=Path(self.tmp.name)/'tls.crt';pem.write_text('certificate');a=update.config_fingerprint(str(pem))
        pem.write_text('certificatE');self.assertNotEqual(update.config_fingerprint(str(pem)),a)

class ReconcilePlanTests(unittest.TestCase):
    def test_format_only_changes_are_accepted_and_content_changes_are_listed(self):
        with tempfile.TemporaryDirectory() as tmp:
            same=Path(tmp)/'same.crt';same.write_text('unchanged');edited=Path(tmp)/'mobile.json';edited.write_text('{"accessHash":"'+'c'*64+'"}')
            unit={'properties':'p','files':{}}
            previous={'configuration':{'runner.service':unit,'configuration':{str(same):hashlib.sha256(b'unchanged').hexdigest(),str(edited):hashlib.sha256(b'older bytes').hexdigest()}}}
            current={'runner.service':unit,'configuration':{str(same):update.config_fingerprint(str(same)),str(edited):update.config_fingerprint(str(edited))}}
            self.assertEqual(reconcile.plan({},previous,current),([str(same)],[str(edited)]))
            changed_unit=dict(current,**{'runner.service':{'properties':'q','files':{}}})
            with self.assertRaisesRegex(ValueError,'Units'):reconcile.plan({},previous,changed_unit)
            fewer={'runner.service':unit,'configuration':{str(same):current['configuration'][str(same)]}}
            with self.assertRaisesRegex(ValueError,'set of tracked'):reconcile.plan({},previous,fewer)

if __name__=='__main__':unittest.main()
