#!/usr/bin/env python3
import unittest
from unittest.mock import patch
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
profiles=load('admin_profiles')

class AdminProfiles(unittest.TestCase):
    def test_snapshot_and_start_resource(self):
        config={'gatewayUser':'web'}
        with patch.object(profiles.update,'config',return_value=config):
            value=profiles.snapshot(enabled=True,is_running=lambda:False)
            self.assertTrue(value['canEnableResource'])
            self.assertFalse(value['canEnableHardening'])
            started=[]
            result=profiles.start('resource',snapshot_fn=lambda:profiles.snapshot(enabled=True,is_running=lambda:False),start_unit=started.append,updates_running=lambda:False)
            self.assertTrue(result['started'])
            self.assertEqual(started,['agentd-apply-resources.service'])

    def test_hardening_requires_resource(self):
        config={'gatewayUser':'web','resourceProfile':'standard-v1'}
        with patch.object(profiles.update,'config',return_value=config):
            value=profiles.snapshot(enabled=True,is_running=lambda:False)
            self.assertFalse(value['canEnableResource'])
            self.assertTrue(value['canEnableHardening'])
            started=[]
            profiles.start('hardening',snapshot_fn=lambda:profiles.snapshot(enabled=True,is_running=lambda:False),start_unit=started.append,updates_running=lambda:False)
            self.assertEqual(started,['agentd-apply-gateway-hardening.service'])

    def test_refuses_when_already_applied(self):
        config={'gatewayUser':'web','resourceProfile':'standard-v1','gatewayHardening':'gateway-hardening-v1'}
        with patch.object(profiles.update,'config',return_value=config):
            value=profiles.snapshot(enabled=True,is_running=lambda:False)
            self.assertFalse(value['canEnableResource'])
            self.assertFalse(value['canEnableHardening'])
            with self.assertRaisesRegex(ValueError,'not available'):
                profiles.start('resource',snapshot_fn=lambda:value,start_unit=lambda unit:None,updates_running=lambda:False)

if __name__=='__main__':
    unittest.main()
