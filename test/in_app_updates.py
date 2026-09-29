import json, os, subprocess, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import release, update
import run_approved_update as job
import approve_release as approval
import admin_updates as listing

OWNER=os.getuid()

def build(root,version,schema=2,marker='fixture'):
    repo=root/('repo-'+version);repo.mkdir()
    required=release.FILES|{'src/server.ts','src/runner.ts','src/task-database.ts','src/mobile.ts','public/index.html','deploy/agentd.service','scripts/test-isolation-ci.mjs','scripts/update.py'}
    for name in required:
        path=repo/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(marker)
    (repo/'package.json').write_text(json.dumps({'version':version}))
    (repo/'src/task-database.ts').write_text(f'export const TASK_SCHEMA_VERSION = {schema};')
    git=lambda *a:subprocess.check_output(['git','-C',str(repo),*a],stderr=subprocess.DEVNULL).decode().strip()
    git('init','-q');git('add','.');git('-c','user.name=t','-c','user.email=t@example.invalid','commit','-qm','fixture')
    archive=root/(version+'.tar.gz');sha=release.build(repo,git('rev-parse','HEAD'),archive);return archive,sha

class InAppUpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve()
        self.releases=self.root/'releases';self.deployment=self.root/'deployment';self.deployment.mkdir(mode=0o700)
        (self.deployment/'installed.json').write_text(json.dumps({'release':{'version':'0.62.3','revision':'a'*40,'taskSchemaVersion':2},'configuration':{'same':True}}))
    def tearDown(self):self.tmp.cleanup()

    def test_approval_is_verified_idempotent_and_never_silently_replaced(self):
        archive,sha=build(self.root,'0.63.0')
        value=approval.approve(archive,sha,'Adds in-app updates.',self.releases,OWNER)
        self.assertEqual((value['version'],value['sha256']),('0.63.0',sha))
        self.assertEqual(oct(self.releases.stat().st_mode&0o777),'0o700')
        self.assertEqual(approval.approve(archive,sha,'again',self.releases,OWNER)['notes'],'Adds in-app updates.')
        second=self.root/'second';second.mkdir();other,other_sha=build(second,'0.63.0',marker='different content')
        with self.assertRaisesRegex(ValueError,'different approval'):approval.approve(other,other_sha,'',self.releases,OWNER)
        with self.assertRaisesRegex(ValueError,'hash mismatch'):approval.approve(archive,'0'*64,'',self.releases,OWNER)

    def test_approved_release_rejects_bad_versions_tampering_and_foreign_owners(self):
        archive,sha=build(self.root,'0.63.0');approval.approve(archive,sha,'',self.releases,OWNER)
        for bad in ('../0.63.0','0.63','0.63.0.1','v0.63.0'):
            with self.assertRaises(ValueError):job.approved(bad,self.releases,OWNER)
        with self.assertRaisesRegex(ValueError,'root-owned'):job.approved('0.63.0',self.releases,OWNER+1)
        stored=self.releases/'0.63.0.tar.gz';data=bytearray(stored.read_bytes());data[-1]^=1;stored.write_bytes(bytes(data))
        with self.assertRaises(ValueError):job.approved('0.63.0',self.releases,OWNER)

    def run_job(self,version,fail_on=None):
        calls=[]
        def runner(args,**kwargs):
            calls.append(args[2:4] if args[2].endswith('update.py') else [Path(args[2]).name])
            if fail_on and fail_on in ' '.join(args):raise subprocess.CalledProcessError(1,args)
        c={'deployment':str(self.deployment),'app':str(self.root/'app'),'resourceProfile':'standard-v1','gatewayHardening':'gateway-hardening-v1','adminUnit':'agentd-admin.service'}
        with patch.object(update,'config',return_value=c),patch.object(update,'canonical',side_effect=lambda v:Path(v)):
            try:job.run(version,'/etc/agentd/update.json',self.releases,runner,OWNER)
            finally:pass
        return calls

    def status(self):return json.loads((self.deployment/job.STATUS).read_text())

    def test_job_runs_plan_install_and_verifications_and_reports_fixed_status(self):
        archive,sha=build(self.root,'0.63.0');approval.approve(archive,sha,'',self.releases,OWNER)
        calls=self.run_job('0.63.0')
        self.assertEqual([c[-1] if len(c)>1 else c[0] for c in calls],['plan','install','apply_resources.py','apply_gateway_hardening.py','apply_diagnostics.py'])
        value=self.status();self.assertEqual((value['state'],value['stage'],value['version']),('succeeded','succeeded','0.63.0'))
        self.assertEqual(oct((self.deployment/job.STATUS).stat().st_mode&0o777),'0o600')
        self.assertFalse(any(p.name.startswith('agentd-update-') and p.is_dir() for p in self.deployment.iterdir()))

    def test_job_refuses_older_or_equal_releases_and_records_failed_stage(self):
        archive,sha=build(self.root,'0.62.3');approval.approve(archive,sha,'',self.releases,OWNER)
        with self.assertRaisesRegex(ValueError,'newer'):self.run_job('0.62.3')
        self.assertEqual((self.status()['state'],self.status()['failedStage']),('failed','verifying'))
        archive,sha=build(self.root,'0.63.1');approval.approve(archive,sha,'',self.releases,OWNER)
        with self.assertRaises(subprocess.CalledProcessError):self.run_job('0.63.1',fail_on='install')
        value=self.status();self.assertEqual((value['state'],value['failedStage']),('failed','installing'))
        self.assertNotIn('/',value['message'])

    def test_listing_marks_newer_valid_releases_and_sanitizes_status(self):
        for version in ('0.62.3','0.63.0'):
            archive,sha=build(self.root,version,schema=3 if version=='0.63.0' else 2);approval.approve(archive,sha,'notes '+version,self.releases,OWNER)
        (self.releases/'9.9.9.json').write_text('{}')
        (self.deployment/job.STATUS).write_text(json.dumps({'format':1,'version':'0.63.0','stage':'installing','state':'running','message':'x','secret':'/etc/agentd'}))
        with patch.object(update,'config',return_value={}),patch.object(update,'inventory',return_value={'same':True}):
            value=listing.snapshot(self.releases,self.deployment,Path('/unused'),lambda:True,OWNER)
        self.assertEqual([c['version'] for c in value['candidates']],['9.9.9','0.63.0','0.62.3'])
        by={c['version']:c for c in value['candidates']}
        self.assertEqual((by['0.63.0']['valid'],by['0.63.0']['newer'],by['0.63.0']['schemaChange']),(True,True,True))
        self.assertEqual((by['0.62.3']['newer'],by['9.9.9']['valid']),(False,False))
        self.assertEqual((value['configuration'],value['running']),('ok',True))
        self.assertNotIn('secret',value['job'])

if __name__=='__main__':unittest.main()
