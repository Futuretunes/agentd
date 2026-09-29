import json, os, sys, tempfile, time, unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import update, backup_retention
import run_approved_update as job
import run_rollback as rollback

def manifest(version,schema=2):return {'format':1,'version':version,'revision':(version.replace('.','')*40)[:40],'taskSchemaVersion':schema,'files':{}}

class RollbackTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve()
        self.opt=self.root/'opt';self.opt.mkdir();self.app=self.opt/'agentd';self.state=self.root/'state';self.deployment=self.root/'deployment'
        self.deployment.mkdir(mode=0o700)
        self.write_app(self.app,'0.63.1');self.state.mkdir();(self.state/'tasks.sqlite').write_text('current tasks')
        self.record={'release':manifest('0.63.1'),'configuration':{'same':True}}
        (self.deployment/'installed.json').write_text(json.dumps(self.record))
        self.c={'app':str(self.app),'state':str(self.state),'deployment':str(self.deployment),'runnerUnit':'agentd.service','mobileUnit':'agentd-mobile.service','adminUnit':'agentd-admin.service'}
        self.patches=[patch.object(backup_retention,'ROOT_UID',os.getuid())];[p.start() for p in self.patches]
    def tearDown(self):
        [p.stop() for p in self.patches];self.tmp.cleanup()
    def write_app(self,path,version):
        (path/'scripts').mkdir(parents=True);(path/'release-manifest.json').write_text(json.dumps(manifest(version)));(path/'VERSION').write_text(version)
    def backup(self,version,age,state='older tasks'):
        path=Path(tempfile.mkdtemp(prefix='agentd-backup-',dir=self.opt));self.write_app(path/'app',version)
        (path/'state').mkdir();(path/'state'/'tasks.sqlite').write_text(state)
        backup_retention.completed(self.c,path,{'release':{'version':version}})
        marker=path/backup_retention.MARKER;data=json.loads(marker.read_text());data['completed']=time.time()-age;marker.write_text(json.dumps(data))
        return path
    ok=staticmethod(lambda *a,**k:SimpleNamespace(returncode=0))

    def test_candidate_is_newest_older_compatible_backup(self):
        self.backup('0.62.3',300);self.backup('0.63.0',200);self.backup('0.64.0',100)
        target,reason=rollback.candidate(self.c,self.record['release'],'/cfg',self.ok)
        self.assertEqual((target['version'],reason),('0.63.0',None))
        target,reason=rollback.candidate(self.c,self.record['release'],'/cfg',lambda *a,**k:SimpleNamespace(returncode=1))
        self.assertIsNone(target);self.assertIn('configuration',reason)
        self.assertEqual(rollback.candidate(self.c,manifest('0.62.0'),'/cfg',self.ok),(None,'No earlier version backup is available.'))

    def run_rollback(self,version,**overrides):
        stubs=dict(run=lambda *a,**k:None,control_idle=lambda *a:None,idle=lambda *a:None,ready=lambda *a:None,
                   inventory=lambda *a:{'same':True},same_filesystem=lambda *a:None,config=lambda *a:self.c,canonical=lambda v:Path(v))
        stubs.update(overrides)
        with patch.multiple(update,**stubs):return rollback.run(version,'/cfg',self.ok)

    def status(self):return json.loads((self.deployment/job.STATUS).read_text())

    def test_rollback_restores_older_app_and_state_and_saves_what_was_running(self):
        source=self.backup('0.63.0',100)
        self.run_rollback('0.63.0')
        self.assertEqual((self.app/'VERSION').read_text(),'0.63.0');self.assertEqual((self.state/'tasks.sqlite').read_text(),'older tasks')
        self.assertTrue((source/'app'/'VERSION').exists(),'source backup must stay intact')
        saved=[p for p in self.opt.glob('agentd-backup-*') if p!=source and (p/'app'/'VERSION').exists() and (p/'app'/'VERSION').read_text()=='0.63.1']
        self.assertEqual(len(saved),1);self.assertEqual((saved[0]/'state'/'tasks.sqlite').read_text(),'current tasks')
        self.assertTrue((saved[0]/backup_retention.MARKER).exists())
        self.assertEqual(json.loads((self.deployment/'installed.json').read_text())['release']['version'],'0.63.0')
        value=self.status();self.assertEqual((value['kind'],value['state'],value['savedVersion']),('rollback','succeeded','0.63.1'))
        self.assertFalse((self.deployment/'rollback-pending.json').exists())
        # The rolled-back version cannot "roll back" to the newer saved copy.
        self.assertEqual(rollback.candidate(self.c,manifest('0.63.0'),'/cfg',self.ok)[0],None)

    def test_failed_readiness_puts_back_exactly_what_was_running(self):
        self.backup('0.63.0',100)
        def not_ready(*a):raise ValueError('not ready')
        with self.assertRaisesRegex(ValueError,'not ready'):self.run_rollback('0.63.0',ready=not_ready)
        self.assertEqual((self.app/'VERSION').read_text(),'0.63.1');self.assertEqual((self.state/'tasks.sqlite').read_text(),'current tasks')
        self.assertEqual(json.loads((self.deployment/'installed.json').read_text())['release']['version'],'0.63.1')
        value=self.status();self.assertEqual((value['state'],value['failedStage']),('failed','restoring'))

    def test_changed_target_or_drift_refuses_before_any_change(self):
        self.backup('0.63.0',100)
        with self.assertRaisesRegex(ValueError,'target changed'):self.run_rollback('0.62.3')
        with self.assertRaisesRegex(ValueError,'drifted'):self.run_rollback('0.63.0',inventory=lambda *a:{'other':True})
        self.assertEqual((self.app/'VERSION').read_text(),'0.63.1')
        self.assertEqual((self.status()['failedStage'],self.status()['kind']),('verifying','rollback'))
        self.assertFalse((self.deployment/'rollback-pending.json').exists())

if __name__=='__main__':unittest.main()
