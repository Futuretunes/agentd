#!/usr/bin/env python3
import importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_restart',ROOT/'scripts/admin_restart.py')
restart=importlib.util.module_from_spec(spec);spec.loader.exec_module(restart)

class RestartTest(unittest.TestCase):
    def test_restart_only_allowlisted_units(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deployment=root/'deployment';deployment.mkdir()
            (deployment/'installed.json').write_text(json.dumps({'release':{'version':'0.65.0'},'configuration':{'fixed':'digest'}}))
            config={'runnerUnit':'agentd.service','mobileUnit':'agentd-mobile.service'}
            with patch.object(restart,'CONFIG',root/'update.json'),patch.object(restart,'DEPLOYMENT',deployment),patch.object(restart.update,'config',return_value=config),patch.object(restart.update,'configuration_state',return_value='ok'),patch.object(restart.admin_updates,'running',return_value=False),patch.object(restart.subprocess,'run') as run:
                value=restart.restart('runner')
            self.assertEqual(value,{'restarted':True,'target':'runner'})
            self.assertEqual(run.call_args.args[0][:3],['/usr/bin/systemctl','restart','agentd.service'])
            with patch.object(restart,'CONFIG',root/'update.json'),patch.object(restart,'DEPLOYMENT',deployment),patch.object(restart.update,'config',return_value=config),patch.object(restart.update,'configuration_state',return_value='ok'),patch.object(restart.admin_updates,'running',return_value=False),patch.object(restart.subprocess,'run'):
                self.assertEqual(restart.restart('gateway')['target'],'gateway')
            with self.assertRaises(ValueError):restart.restart('admin')
            with patch.object(restart.admin_updates,'running',return_value=True):
                with self.assertRaises(RuntimeError):restart.restart('runner')

if __name__=='__main__':unittest.main()
