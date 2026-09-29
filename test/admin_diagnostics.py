#!/usr/bin/env python3
import importlib.util,json,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_diagnostics',ROOT/'scripts/admin_diagnostics.py')
diagnostics=importlib.util.module_from_spec(spec);spec.loader.exec_module(diagnostics)

class DiagnosticsTest(unittest.TestCase):
    def test_snapshot_is_normalized_and_contains_no_configuration_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deployment=root/'deployment';deployment.mkdir()
            (deployment/'installed.json').write_text(json.dumps({'release':{'version':'0.62.0','revision':'a'*40,'taskSchemaVersion':2},'configuration':{'fixed':'digest'}}))
            config={'app':str(root),'runnerUnit':'agentd.service','mobileUnit':'agentd-mobile.service','adminUnit':'agentd-admin.service','resourceProfile':'standard-v1','gatewayHardening':'gateway-hardening-v1','gatewayUser':'web'}
            with patch.object(diagnostics,'CONFIG',root/'update.json'),patch.object(diagnostics,'DEPLOYMENT',deployment),patch.object(diagnostics.update,'config',return_value=config),patch.object(diagnostics.update,'inventory',return_value={'fixed':'digest'}),patch.object(diagnostics,'service',return_value={'state':'active','detail':'running','restarts':0,'since':None}),patch.object(diagnostics.shutil,'disk_usage',return_value=SimpleNamespace(free=10,total=20)):
                value=diagnostics.snapshot()
            self.assertEqual(value['configuration']['state'],'ok')
            self.assertEqual(set(value['services']),{'runner','gateway','administration'})
            self.assertEqual(value['release']['revision'],'a'*12)
            text=json.dumps(value)
            self.assertNotIn(str(root),text)
            self.assertNotIn('digest',text)

    def test_service_uses_only_fixed_systemctl_query(self):
        output='ActiveState=active\nSubState=running\nNRestarts=2\nExecMainStartTimestamp=Mon 2026-01-01\n'
        with patch.object(diagnostics.subprocess,'run',return_value=SimpleNamespace(stdout=output)) as run:
            value=diagnostics.service('agentd.service')
        self.assertEqual(value['restarts'],2)
        command=run.call_args.args[0]
        self.assertEqual(command[:3],['/usr/bin/systemctl','show','agentd.service'])
        with self.assertRaises(ValueError):diagnostics.service('../other.service')

if __name__=='__main__':unittest.main()
