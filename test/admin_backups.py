#!/usr/bin/env python3
import importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_backups',ROOT/'scripts/admin_backups.py')
backups=importlib.util.module_from_spec(spec);spec.loader.exec_module(backups)

class BackupsTest(unittest.TestCase):
    def test_snapshot_hides_host_paths(self):
        plan={'keep':3,'minimumAgeDays':30,'blocked':False,'fingerprint':'a'*64,'items':[
            {'path':'/var/lib/agentd-backup-abc','completed':1700000000,'bytes':100,'pinned':False,'eligible':True,'version':'0.64.0'}
        ]}
        with patch.object(backups.update,'config',return_value={'app':'/opt/agentd'}),patch.object(backups.backup_retention,'plan',return_value=plan),patch.object(backups.rollback,'candidate',return_value=(None,'none')):
            value=backups.snapshot()
        self.assertEqual(value['items'][0]['id'],'agentd-backup-abc')
        self.assertFalse(value['items'][0]['rollbackTarget'])
        self.assertNotIn('/var/lib',json.dumps(value))
        self.assertTrue(value['items'][0]['eligible'])
        self.assertIn('rollback',value)

    def test_prune_rejects_invalid_fingerprint(self):
        with self.assertRaises(ValueError):backups.prune('zzz')
        with patch.object(backups.update,'config',return_value={}),patch.object(backups.backup_retention,'prune',return_value=2) as prune:
            value=backups.prune('b'*64)
        self.assertEqual(value['removed'],2)
        prune.assert_called_once()

if __name__=='__main__':unittest.main()
