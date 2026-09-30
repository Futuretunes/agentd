#!/usr/bin/env python3
import importlib.util,json,unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_backups',ROOT/'scripts/admin_backups.py')
backups=importlib.util.module_from_spec(spec);spec.loader.exec_module(backups)

class BackupsTest(unittest.TestCase):
    def test_snapshot_hides_host_paths(self):
        plan={'keep':3,'minimumAgeDays':30,'blocked':False,'fingerprint':'a'*64,'items':[
            {'path':'/var/lib/agentd-backup-abc12','completed':1700000000,'bytes':100,'pinned':False,'eligible':True,'version':'0.64.0'}
        ]}
        with patch.object(backups.update,'config',return_value={'app':'/opt/agentd'}),patch.object(backups.backup_retention,'plan',return_value=plan),patch.object(backups.rollback,'candidate',return_value=(None,'none')):
            value=backups.snapshot()
        self.assertEqual(value['items'][0]['id'],'agentd-backup-abc12')
        self.assertFalse(value['items'][0]['rollbackTarget'])
        self.assertFalse(value['items'][0]['restorable'])
        self.assertFalse(value['restoreEnabled'])
        self.assertNotIn('/var/lib',json.dumps(value))
        self.assertTrue(value['items'][0]['eligible'])
        self.assertIn('rollback',value)

    def test_snapshot_marks_restorable_when_unit_enabled(self):
        plan={'keep':3,'minimumAgeDays':30,'blocked':False,'fingerprint':'a'*64,'items':[
            {'path':'/opt/agentd-backup-older1','completed':1700000000,'bytes':100,'pinned':False,'eligible':False,'version':'0.72.0'},
            {'path':'/opt/agentd-backup-newer1','completed':1700000100,'bytes':100,'pinned':False,'eligible':False,'version':'0.73.0'},
        ]}
        target={'path':'/opt/agentd-backup-newer1','version':'0.73.0','revision':'a'*40,'completedAt':'2026-01-01T00:00:00+00:00','taskSchemaVersion':2}
        with patch.object(backups.update,'config',return_value={'app':'/opt/agentd','restoreUnit':'agentd-restore@.service'}),patch.object(backups.backup_retention,'plan',return_value=plan),patch.object(backups.rollback,'candidate',return_value=(target,None)),patch.object(backups.rollback,'restorable',return_value={'agentd-backup-older1','agentd-backup-newer1'}),patch('pathlib.Path.read_text',return_value=json.dumps({'release':{'version':'0.74.0'}})):
            value=backups.snapshot()
        self.assertTrue(value['restoreEnabled'])
        by_id={item['id']:item for item in value['items']}
        self.assertTrue(by_id['agentd-backup-older1']['restorable'])
        self.assertTrue(by_id['agentd-backup-newer1']['restorable'])
        self.assertTrue(by_id['agentd-backup-newer1']['rollbackTarget'])
        self.assertFalse(by_id['agentd-backup-older1']['rollbackTarget'])

    def test_prune_rejects_invalid_fingerprint(self):
        with self.assertRaises(ValueError):backups.prune('zzz')
        with patch.object(backups.update,'config',return_value={}),patch.object(backups.backup_retention,'prune',return_value=2) as prune:
            value=backups.prune('b'*64)
        self.assertEqual(value['removed'],2)
        prune.assert_called_once()

if __name__=='__main__':unittest.main()
