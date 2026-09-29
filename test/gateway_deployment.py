import json, os, sys, tempfile, unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import separate_gateway as migration
import update

class GatewayMigrationTests(unittest.TestCase):
    def test_success_and_failed_acceptance_preserve_old_configuration(self):
        for fail in (False,True):
            with self.subTest(fail=fail),tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp).resolve();deploy=root/'deployment';deploy.mkdir();backup=root/'backup';backup.mkdir()
                key=root/'key';key.write_text('fixture key');cert=root/'cert';cert.write_text('fixture cert')
                mobile=root/'mobile.json';mobile.write_text(json.dumps({'key':str(key),'cert':str(cert),'accessHash':'fixture','socket':'/old.sock'}))
                c={'app':str(root/'app'),'state':str(root/'state'),'deployment':str(deploy),'controlSocket':'/old.sock','runnerUnit':'runner.service','mobileUnit':'mobile.service','configFiles':[str(mobile)]}
                config=root/'update.json';config.write_text(json.dumps(c));old_config=config.read_bytes()
                previous={'release':{'version':'0.22.0','taskSchemaVersion':1},'configuration':{'old':True}}
                record=deploy/'installed.json';record.write_text(json.dumps(previous));old_record=record.read_bytes()
                drops=[root/'runner.d/boundary.conf',root/'web.d/boundary.conf'];web=root/'web';commands=[]
                def run(args,**kw):
                    commands.append(args)
                    if args[0]=='nsenter' and fail:raise ValueError('Probe rejected unsafe gateway')
                account=SimpleNamespace(pw_gid=os.getgid())
                with patch.object(migration,'identity',return_value=account),patch.object(migration,'drop_paths',return_value=drops),patch.object(migration,'WEB_CONFIG',web),patch.object(migration.os,'chown'),patch.object(update,'run',side_effect=run),patch.object(update,'control_idle'),patch.object(update,'idle'),patch.object(update,'ready'),patch.object(update,'capture',return_value='123'),patch.object(update,'inventory',side_effect=[{'old':True},{'new':True},{'new':True}]):
                    if fail:
                        with self.assertRaisesRegex(ValueError,'Probe rejected'):migration.change(c,config,previous,{'old':True},backup)
                        self.assertEqual(config.read_bytes(),old_config);self.assertEqual(record.read_bytes(),old_record)
                        self.assertFalse(web.exists());self.assertFalse(any(p.exists() for p in drops));self.assertTrue((deploy/'gateway-pending.json').exists())
                    else:
                        migration.change(c,config,previous,{'old':True},backup)
                        self.assertEqual(json.loads(config.read_text())['gatewayUser'],'agentd-web')
                        self.assertEqual(json.loads(record.read_text())['configuration'],{'new':True})
                        self.assertFalse((deploy/'gateway-pending.json').exists())
                        self.assertEqual(web.stat().st_mode&0o777,0o750)
                        self.assertEqual((web/'tls.key').stat().st_mode&0o777,0o640)
                self.assertEqual(mobile.read_text(),json.dumps({'key':str(key),'cert':str(cert),'accessHash':'fixture','socket':'/old.sock'}))
                self.assertEqual((backup/'update.json').read_bytes(),old_config)
                self.assertTrue(any(command[0]=='nsenter' for command in commands))

    def test_separate_profile_rejects_shared_identity_and_socket_parent(self):
        with tempfile.TemporaryDirectory() as tmp:
            c=json.loads((Path(__file__).resolve().parents[1]/'deploy/update.example.json').read_text());p=Path(tmp)/'config.json'
            for changes in [{'gatewayUser':'agentd','gatewaySocket':'/run/web/gateway.sock'},{'gatewayUser':'root','gatewaySocket':'/run/web/gateway.sock'},{'gatewayUser':'agentd-web','gatewaySocket':'/run/agentd/gateway.sock'},{'gatewayUser':'agentd-web'}]:
                p.write_text(json.dumps(dict(c,**changes)))
                with self.assertRaises(ValueError):update.config(p)

    def test_inventory_verifies_separate_identity_and_denied_paths(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve();c=json.loads((Path(__file__).resolve().parents[1]/'deploy/update.example.json').read_text());c.update(gatewayUser='agentd-web',gatewaySocket='/run/agentd-web/gateway.sock')
            mobile=root/'mobile.json';mobile.write_text(json.dumps({'socket':c['gatewaySocket']}));c['configFiles']=[str(mobile)]
            unit=root/'unit';unit.write_text('fixture')
            def capture(args):
                runner=args[2]==c['runnerUnit']
                env='AGENTD_RUNNER=1 AGENTD_STATE_DIR='+c['state']+' AGENTD_CONTROL_SOCKET='+c['controlSocket']+' AGENTD_GATEWAY_SOCKET='+c['gatewaySocket']+' AGENTD_GATEWAY_GID=1234' if runner else 'AGENTD_MOBILE_CONFIG='+str(mobile)
                p={'User':'agentd' if runner else 'agentd-web','Group':'agentd' if runner else 'agentd-web','SupplementaryGroups':'agentd-web' if runner else '', 'RuntimeDirectory':'agentd agentd-web' if runner else '', 'RuntimeDirectoryMode':'0700','PrivateDevices':'yes','WorkingDirectory':c['app'],'NoNewPrivileges':'yes','CapabilityBoundingSet':'','ProtectSystem':'strict','ProtectHome':'yes','PrivateTmp':'yes','ProtectKernelModules':'yes','ProtectControlGroups':'yes','RestrictSUIDSGID':'yes','LockPersonality':'yes','ProtectKernelTunables':'no' if runner else 'yes','RestrictAddressFamilies':'AF_UNIX AF_INET AF_INET6 AF_NETLINK','FragmentPath':str(unit),'DropInPaths':'','EnvironmentFiles':'','Environment':env,'ExecStart':'{ path='+c['node']+' ; argv[]='+c['node']+' '+c['app']+'/src/'+('server.ts' if runner else 'mobile.ts')+' ; }','ReadWritePaths':'/srv/agentd /var/lib/agentd' if runner else '', 'InaccessiblePaths':'' if runner else '/srv/agentd /var/lib/agentd /run/agentd /etc/agentd'}
                return '\n'.join(k+'='+v for k,v in p.items())
            with patch.object(update.pwd,'getpwnam',return_value=SimpleNamespace(pw_gid=1234,pw_dir='/var/lib/agentd')):
                with patch.object(update,'capture',side_effect=capture):self.assertIn('configuration',update.inventory(c))
                for old,new in [('User=agentd-web','User=agentd'),('ReadWritePaths=\n','ReadWritePaths=/srv/agentd\n'),('InaccessiblePaths=/srv/agentd','InaccessiblePaths='),('AGENTD_GATEWAY_GID=1234','AGENTD_GATEWAY_GID=1')]:
                    with patch.object(update,'capture',side_effect=lambda args:capture(args).replace(old,new)):
                        with self.assertRaises(ValueError):update.inventory(c)

if __name__=='__main__':unittest.main()
