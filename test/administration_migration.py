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

if __name__=='__main__':unittest.main()
