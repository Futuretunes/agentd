#!/usr/bin/env python3
import importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_configuration',ROOT/'scripts/admin_configuration.py')
configuration=importlib.util.module_from_spec(spec);spec.loader.exec_module(configuration)

class ConfigurationTest(unittest.TestCase):
    def test_snapshot_is_boolean_flags_without_paths(self):
        config={'resourceProfile':'standard-v1','gatewayHardening':'gateway-hardening-v1','gatewayUser':'web','adminUnit':'agentd-admin.service','mobileUnit':'agentd-mobile.service','configFiles':[]}
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deployment=root/'deployment';deployment.mkdir()
            (deployment/'installed.json').write_text(json.dumps({'configuration':{'x':1}}))
            with patch.object(configuration,'CONFIG',root/'update.json'),patch.object(configuration,'DEPLOYMENT',deployment),patch.object(configuration.update,'config',return_value=config),patch.object(configuration.update,'configuration_state',return_value='ok'),patch.object(configuration.admin_diagnostics,'gateway_config_readable',return_value=True),patch.object(configuration.subprocess,'run',side_effect=OSError()):
                value=configuration.snapshot()
            self.assertTrue(value['configuration']['resourceProfile'])
            self.assertTrue(value['configuration']['separateGateway'])
            self.assertIsNone(value['tls']['certificateExpires'])
            self.assertNotIn('/etc',json.dumps(value))

    def test_tls_expiry_rejects_relative_paths(self):
        self.assertIsNone(configuration.tls_expiry('../etc/passwd'))
        self.assertIsNone(configuration.tls_expiry('relative.crt'))

if __name__=='__main__':unittest.main()
