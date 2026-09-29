#!/usr/bin/env python3
import importlib.util,sys,unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

administration=load('apply_administration');diagnostics=load('apply_diagnostics')

class FakeSocket:
    attempts=0
    def __init__(self,response):self.response=response
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def settimeout(self,value):pass
    def connect(self,path):
        FakeSocket.attempts+=1
        if FakeSocket.attempts==1:raise FileNotFoundError()
    def sendall(self,data):pass
    def recv(self,size):return self.response

class MigrationProbeTest(unittest.TestCase):
    def test_rotation_probe_waits_for_helper_socket(self):
        FakeSocket.attempts=0
        with patch.object(administration.socket,'socket',side_effect=lambda *a:FakeSocket(b'{"ok":false}\n')),patch.object(administration.time,'sleep'):
            administration.probe(1)
        self.assertEqual(FakeSocket.attempts,2)

    def test_diagnostics_probe_waits_for_helper_socket(self):
        FakeSocket.attempts=0;response=b'{"ok":true,"result":{"format":1,"services":{}}}\n'
        with patch.object(diagnostics.socket,'socket',side_effect=lambda *a:FakeSocket(response)),patch.object(diagnostics.time,'sleep'):
            diagnostics.probe(1)
        self.assertEqual(FakeSocket.attempts,2)

    def test_diagnostics_skips_rewrite_and_restart_when_unit_is_current(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'app/deploy').mkdir(parents=True);unit=root/'agentd-admin.service'
            (root/'app/deploy/agentd-admin.service').write_text('[Unit]\n');unit.write_text('[Unit]\n')
            c={'app':str(root/'app')};runs=[]
            with patch.object(diagnostics,'unit_path',return_value=unit),patch.object(diagnostics,'probe'),\
                 patch.object(diagnostics.update,'capture',return_value='no\n'),patch.object(diagnostics.update,'run',side_effect=runs.append):
                self.assertTrue(diagnostics.unchanged(c))
                self.assertTrue(all('restart' not in r and 'stop' not in r for r in runs))
                with patch.object(diagnostics.update,'capture',return_value='yes\n'):self.assertFalse(diagnostics.unchanged(c))
                unit.write_text('[Unit]\nDescription=edited\n');self.assertFalse(diagnostics.unchanged(c))

if __name__=='__main__':unittest.main()
