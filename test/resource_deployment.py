import json, os, sys, tempfile, time, unittest
from pathlib import Path
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import backup_retention as backups
import apply_resources as resources
import update

class ResourceDeploymentTests(unittest.TestCase):
    def test_backup_policy_preserves_recent_pinned_unknown_failed_and_recovery(self):
        with tempfile.TemporaryDirectory() as tmp,patch.object(backups,'ROOT_UID',os.getuid()):
            root=Path(tmp).resolve();deploy=root/'deployment';deploy.mkdir();c={'app':str(root/'app'),'deployment':str(deploy)};now=time.time()
            all=[]
            for i in range(6):
                path=root/('agentd-backup-'+str(i));path.mkdir(mode=0o700);(path/'app').mkdir();(path/'state').mkdir();(path/'state/fixture').write_text('saved')
                s=path.stat();(path/backups.MARKER).write_text(json.dumps({'format':1,'dev':s.st_dev,'ino':s.st_ino,'completed':now-(40+i)*86400,'version':'fixture'}));all.append(path)
            (all[3]/'KEEP').touch()
            unknown=root/'agentd-backup-legacy';unknown.mkdir(mode=0o700);(unknown/'important').write_text('preserve')
            linked=root/'agentd-backup-link';linked.symlink_to(all[5],target_is_directory=True)
            p=backups.plan(c);self.assertEqual([x['eligible'] for x in p['items']],[False,False,False,False,True,True])
            (deploy/'resources-pending.json').write_text('{}');self.assertTrue(backups.plan(c)['blocked'])
            with self.assertRaisesRegex(ValueError,'pending'):backups.prune(c,p['fingerprint'])
            (deploy/'resources-pending.json').unlink();(all[4]/'KEEP').touch()
            with self.assertRaisesRegex(ValueError,'changed'):backups.prune(c,p['fingerprint'])
            self.assertEqual(backups.prune(c,backups.plan(c)['fingerprint']),1)
            self.assertFalse(all[5].exists());self.assertTrue(unknown.exists());self.assertTrue(all[3].exists());self.assertTrue(all[4].exists());self.assertTrue(linked.is_symlink())

    def test_backup_measurement_does_not_follow_links_and_limits_large_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);inside=root/'inside';inside.mkdir();outside=root/'outside';outside.write_bytes(b'x'*10000);(inside/'link').symlink_to(outside)
            self.assertEqual(backups.size(inside),0);(inside/'large').write_bytes(b'x'*4096)
            with self.assertRaisesRegex(ValueError,'budget'):backups.size(inside,10)

    def test_kernel_limits_are_verified_independently_of_unit_configuration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);c={'runnerUnit':'runner.service','mobileUnit':'web.service'}
            for key,expected in resources.EXPECTED.items():
                p=root/c[key];p.mkdir();(p/'memory.max').write_text(expected['MemoryMax']);(p/'pids.max').write_text(expected['TasksMax']);(p/'memory.swap.max').write_text('0');(p/'cpu.max').write_text('200000 100000' if key=='runnerUnit' else '50000 100000')
            with patch.object(resources,'CGROUP_ROOT',root),patch.object(update,'capture',side_effect=lambda args:'/'+args[2]):
                resources.live_verify(c);(root/'web.service/pids.max').write_text('max')
                with self.assertRaisesRegex(ValueError,'Kernel resource'):resources.live_verify(c)

    def test_failed_resource_acceptance_restores_configuration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);deploy=root/'deployment';deploy.mkdir();backup=root/'backup';backup.mkdir();config=root/'config';record=deploy/'installed.json'
            c={'app':str(root/'app'),'state':str(root/'state'),'deployment':str(deploy),'runnerUnit':'runner.service','mobileUnit':'web.service'};config.write_text(json.dumps(c));record.write_text('original');old=config.read_bytes();paths=[root/'runner.d/limits',root/'web.d/limits']
            with patch.object(resources,'drops',return_value=paths),patch.object(update,'run'),patch.object(update,'control_idle'),patch.object(update,'idle'),patch.object(update,'ready'),patch.object(update,'inventory',side_effect=[{'old':True},{'new':True}]),patch.object(resources,'verify'),patch.object(resources,'live_verify',side_effect=ValueError('kernel mismatch')):
                with self.assertRaisesRegex(ValueError,'kernel mismatch'):resources.apply(c,config,{'release':{'taskSchemaVersion':1}},{'old':True},backup)
            self.assertEqual(config.read_bytes(),old);self.assertEqual(record.read_text(),'original');self.assertFalse(any(p.exists() for p in paths));self.assertTrue((deploy/'resources-pending.json').exists())

if __name__=='__main__':unittest.main()
