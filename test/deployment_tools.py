from contextlib import closing
import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import release
import update

class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve()
    def tearDown(self): self.tmp.cleanup()
    def database(self,path):
        path.mkdir();db=sqlite3.connect(path/'tasks.sqlite');db.execute('CREATE TABLE tasks(status TEXT)');db.commit();db.close()
    def test_reproducible_exact_commit(self):
        repo=self.root/'repo';repo.mkdir()
        required=release.FILES|{'src/server.ts','src/runner.ts','src/task-database.ts','src/mobile.ts','public/index.html','deploy/agentd.service','scripts/test-isolation-ci.mjs'}
        for name in required:
            path=repo/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('fixture')
        (repo/'package.json').write_text('{"version":"0.21.0"}')
        (repo/'src/task-database.ts').write_text('export const TASK_SCHEMA_VERSION = 1;')
        def git(*args): return subprocess.check_output(['git','-C',str(repo),*args],stderr=subprocess.DEVNULL).decode().strip()
        git('init');git('add','.');git('-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture')
        revision=git('rev-parse','HEAD')
        # Dirty tracked/untracked content is not packaged.
        (repo/'src/server.ts').write_text('dirty');(repo/'credentials.json').write_text('not-a-secret')
        one,two=self.root/'one.tar.gz',self.root/'two.tar.gz'
        a=release.build(repo,revision,one);b=release.build(repo,revision,two);self.assertEqual(a,b)
        manifest,files=release.verify(one,a);self.assertEqual(files['src/server.ts'],b'fixture');self.assertNotIn('credentials.json',files)
        target=self.root/'out';release.extract(files,manifest,target);self.assertTrue((target/'package.json').exists())
        with self.assertRaises(FileExistsError):release.extract(files,manifest,target)
        with self.assertRaisesRegex(ValueError,'hash mismatch'):release.verify(one,'0'*64)
    def test_archive_rejects_links_and_traversal(self):
        for name,kind in [('../escape',tarfile.REGTYPE),('src/link',tarfile.SYMTYPE)]:
            archive=self.root/'bad.tar.gz'
            with tarfile.open(archive,'w:gz') as stream:
                info=tarfile.TarInfo(name);info.type=kind;info.linkname='/etc/passwd';stream.addfile(info,io.BytesIO())
            with self.assertRaises(ValueError):release.verify(archive,release.digest(archive.read_bytes()))
    def test_idle_refuses_future_schema_and_active_work(self):
        state=self.root/'state';self.database(state)
        with closing(sqlite3.connect(state/'tasks.sqlite',isolation_level=None)) as db:db.execute('PRAGMA user_version=999')
        with self.assertRaisesRegex(ValueError,'newer'):update.idle(state,1)
        with closing(sqlite3.connect(state/'tasks.sqlite',isolation_level=None)) as db:db.execute('PRAGMA user_version=1');db.execute("INSERT INTO tasks VALUES('queued')")
        with self.assertRaisesRegex(ValueError,'active'):update.idle(state,1)
    def test_inventory_binds_real_state_and_hides_environment_values(self):
        c=json.loads((Path(__file__).resolve().parents[1]/'deploy/update.example.json').read_text())
        mobile=self.root/'mobile.json';mobile.write_text(json.dumps({'socket':c['controlSocket'],'publicDir':c['app']+'/public'}));c['configFiles']=[str(mobile)]
        unit=self.root/'unit.service';unit.write_text('fixture unit')
        def capture(args):
            runner=args[2]==c['runnerUnit']
            environment=('AGENTD_STATE_DIR='+c['state']+' AGENTD_CONTROL_SOCKET='+c['controlSocket']+' AGENTD_RUNNER=1') if runner else 'AGENTD_MOBILE_CONFIG='+str(mobile)
            properties={'User':c['user'],'Group':c['user'],'WorkingDirectory':c['app'],'NoNewPrivileges':'yes','CapabilityBoundingSet':'','ProtectSystem':'strict','ProtectHome':'yes','PrivateTmp':'yes','ProtectKernelTunables':'no' if runner else 'yes','ProtectKernelModules':'yes','ProtectControlGroups':'yes','RestrictSUIDSGID':'yes','LockPersonality':'yes' if runner else 'no','RestrictAddressFamilies':'AF_UNIX AF_INET AF_INET6 AF_NETLINK','FragmentPath':str(unit),'DropInPaths':'','EnvironmentFiles':'','Environment':environment+' PRIVATE=fixture-secret','ExecStart':'{ path='+c['node']+' ; argv[]='+c['node']+' '+c['app']+'/src/'+('server.ts' if runner else 'mobile.ts')+' ; }'}
            return '\n'.join(k+'='+v for k,v in properties.items())
        with patch.object(update,'capture',side_effect=capture):
            value=update.inventory(c);self.assertNotIn('fixture-secret',json.dumps(value))
        def running(args): return capture(args).replace(' ; }',' ; start_time=[today] ; pid=123 ; status=0/0 }')
        def restarted(args): return capture(args).replace(' ; }',' ; start_time=[tomorrow] ; pid=456 ; status=0/0 }')
        with patch.object(update,'capture',side_effect=running): before=update.inventory(c)
        with patch.object(update,'capture',side_effect=restarted): self.assertEqual(update.inventory(c),before)
        # The shipped gateway omits LockPersonality while the runner enables it.
        original_mobile=mobile.read_text()
        for minimal in ({}, {'socket':c['controlSocket']}, {'publicDir':c['app']+'/public'}):
            mobile.write_text(json.dumps(minimal))
            with patch.object(update,'capture',side_effect=capture): update.inventory(c)
        for field, message in (('socket','control socket'),('publicDir','public directory')):
            for bad in (None,'','/different/location'):
                mobile.write_text(json.dumps({field:bad}))
                with patch.object(update,'capture',side_effect=capture):
                    with self.assertRaisesRegex(ValueError,message): update.inventory(c)
        mobile.write_text(original_mobile)
        def locked_gateway(args): return capture(args).replace('LockPersonality=no','LockPersonality=yes')
        with patch.object(update,'capture',side_effect=locked_gateway): self.assertNotEqual(update.inventory(c),value)
        def unlocked_runner(args): return capture(args).replace('LockPersonality=yes','LockPersonality=no')
        with patch.object(update,'capture',side_effect=unlocked_runner):
            with self.assertRaisesRegex(ValueError,'runnerUnit LockPersonality'):update.inventory(c)
        for setting in ('NoNewPrivileges','RestrictSUIDSGID'):
            def unsafe(args): return capture(args).replace(setting+'=yes',setting+'=no')
            with patch.object(update,'capture',side_effect=unsafe):
                with self.assertRaisesRegex(ValueError,setting):update.inventory(c)
        def wrong(args): return capture(args).replace('AGENTD_STATE_DIR='+c['state'],'AGENTD_STATE_DIR=/different/state')
        with patch.object(update,'capture',side_effect=wrong):
            with self.assertRaisesRegex(ValueError,'state/socket differs'):update.inventory(c)

    def fixture(self):
        app=self.root/'app';app.mkdir();(app/'version').write_text('old')
        stage=self.root/'stage';stage.mkdir();(stage/'version').write_text('new')
        state=self.root/'state';self.database(state)
        deploy=self.root/'deployment';deploy.mkdir();backup=self.root/'backup';backup.mkdir()
        return {'app':str(app),'state':str(state),'deployment':str(deploy),'runnerUnit':'runner.service','mobileUnit':'mobile.service'},stage,backup
    def test_failed_readiness_restores_matching_app_and_database(self):
        c,stage,backup=self.fixture();state=Path(c['state']);before=(state/'tasks.sqlite').read_bytes()
        def fail(*args):
            with closing(sqlite3.connect(state/'tasks.sqlite',isolation_level=None)) as db:db.execute('PRAGMA user_version=1')
            raise ValueError('not ready')
        with patch.object(update,'run'),patch.object(update,'control_idle'),patch.object(update,'inventory',return_value={'same':True}),patch.object(update,'ready',side_effect=fail):
            with self.assertRaisesRegex(ValueError,'not ready'):update.apply(c,{'taskSchemaVersion':1},stage,None,{'same':True},backup)
        self.assertEqual((Path(c['app'])/'version').read_text(),'old');self.assertEqual((state/'tasks.sqlite').read_bytes(),before)
        self.assertTrue((backup/'failed-app').exists());self.assertFalse((Path(c['deployment'])/'installed.json').exists())
    def test_configuration_drift_fails_before_application_swap(self):
        c,stage,backup=self.fixture()
        with patch.object(update,'run'),patch.object(update,'control_idle'),patch.object(update,'inventory',return_value={'changed':True}):
            with self.assertRaisesRegex(ValueError,'Configuration changed'):update.apply(c,{'taskSchemaVersion':1},stage,None,{'same':True},backup)
        self.assertEqual((Path(c['app'])/'version').read_text(),'old');self.assertTrue(stage.exists())
    def test_success_records_release_and_keeps_backup(self):
        c,stage,backup=self.fixture();manifest={'taskSchemaVersion':1,'version':'0.21.0'}
        with patch.object(update,'run'),patch.object(update,'control_idle'),patch.object(update,'inventory',return_value={'same':True}),patch.object(update,'ready'):
            update.apply(c,manifest,stage,None,{'same':True},backup)
        self.assertEqual((Path(c['app'])/'version').read_text(),'new');self.assertEqual((backup/'app/version').read_text(),'old')
        self.assertEqual(json.loads((Path(c['deployment'])/'installed.json').read_text())['release'],manifest)

if __name__=='__main__':unittest.main()
