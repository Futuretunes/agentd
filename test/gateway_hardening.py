import json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import apply_gateway_hardening as hardening
import update

def shown(overrides=None,syscalls='accept access brk clone close'):
    values=dict(hardening.EXPECTED,SystemCallFilter=syscalls,**(overrides or {}))
    return lambda args:'\n'.join(k+'='+v for k,v in values.items())

class GatewayHardeningTests(unittest.TestCase):
    def test_dropin_hardens_without_breaking_node_or_socket_access(self):
        text=hardening.dropin_text()
        self.assertTrue(text.startswith('[Service]\n'))
        for key,value in hardening.SETTINGS:self.assertIn(key+'='+value+'\n',text)
        for absent in ('MemoryDenyWriteExecute','PrivateUsers','PrivateNetwork'):self.assertNotIn(absent,text)
        unit=(Path(__file__).resolve().parents[1]/'deploy/agentd-mobile.service').read_text()
        for key,value in hardening.SETTINGS:self.assertIn(key+'='+value+'\n',unit)

    def test_verification_rejects_missing_settings_and_weak_filters(self):
        c={'mobileUnit':'web.service'}
        with patch.object(update,'capture',side_effect=shown()):hardening.verify(c)
        for case in (shown({'LockPersonality':'no'}),shown({'ProtectProc':'default'}),shown(syscalls=''),shown(syscalls='~@mount'),shown(syscalls='accept mount open')):
            with patch.object(update,'capture',side_effect=case):
                with self.assertRaises(ValueError):hardening.verify(c)

    def test_failed_smoke_test_restores_configuration_and_removes_override(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deploy=root/'deployment';deploy.mkdir();backup=root/'backup';backup.mkdir();config=root/'config';record=deploy/'installed.json'
            c={'app':str(root/'app'),'deployment':str(deploy),'runnerUnit':'runner.service','mobileUnit':'web.service'}
            config.write_text(json.dumps(c));record.write_text('original');old=config.read_bytes();override=root/'units'/hardening.DROPIN
            with patch.object(hardening,'dropin',return_value=override),patch.object(update,'run'),patch.object(update,'inventory',return_value={'same':True}),\
                 patch.object(hardening,'verify'),patch.object(hardening,'smoke',side_effect=ValueError('Gateway smoke test failed')):
                with self.assertRaisesRegex(ValueError,'smoke test failed'):hardening.apply(c,config,{'release':{}},{'same':True},backup)
            self.assertEqual(config.read_bytes(),old);self.assertEqual(record.read_text(),'original');self.assertFalse(override.exists())
            self.assertTrue((deploy/'gateway-hardening-pending.json').exists())

    def test_drift_before_change_leaves_nothing_behind(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deploy=root/'deployment';deploy.mkdir();backup=root/'backup';backup.mkdir();config=root/'config';(deploy/'installed.json').write_text('original')
            c={'app':str(root/'app'),'deployment':str(deploy),'runnerUnit':'runner.service','mobileUnit':'web.service'};config.write_text(json.dumps(c));override=root/'units'/hardening.DROPIN
            with patch.object(hardening,'dropin',return_value=override),patch.object(update,'run'),patch.object(update,'inventory',return_value={'changed':True}):
                with self.assertRaisesRegex(ValueError,'drift'):hardening.apply(c,config,{'release':{}},{'same':True},backup)
            self.assertFalse(override.exists());self.assertFalse((deploy/'gateway-hardening-pending.json').exists())

    def test_updater_accepts_only_the_known_hardening_profile(self):
        c=json.loads((Path(__file__).resolve().parents[1]/'deploy/update.example.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'update.json'
            with patch.object(update,'canonical',side_effect=lambda value:Path(value)):
                for value,ok in (('gateway-hardening-v1',True),('gateway-hardening-v0',False)):
                    path.write_text(json.dumps(dict(c,gatewayHardening=value)))
                    if ok:update.config(path)
                    else:
                        with self.assertRaisesRegex(ValueError,'hardening profile'):update.config(path)

if __name__=='__main__':unittest.main()
