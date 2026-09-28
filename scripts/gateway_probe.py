#!/usr/bin/env python3
"""Run as the gateway UID inside its live mount namespace. Prints no private data."""
import json, os, socket, sys
from pathlib import Path

def request(path, value):
    with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as s:
        s.settimeout(5);s.connect(path);s.sendall((json.dumps(value)+'\n').encode())
        data=b''
        while True:
            part=s.recv(65536)
            if not part: break
            data+=part
            if len(data)>2*1024*1024: raise ValueError('Unexpected response size')
    return json.loads(data)

def probe(config, admin, private):
    if os.geteuid()==0: raise ValueError('Probe must run as gateway user')
    c=json.loads(Path(config).read_text())
    for path in [c['key'],c['cert']]:
        with open(path,'rb') as f:f.read(1)
    for path in private:
        try: os.listdir(path)
        except PermissionError: pass
        else: raise ValueError('Gateway can list a private directory')
    try: request(admin,{'op':'projects'})
    except PermissionError: pass
    else: raise ValueError('Gateway can access the administrative socket')
    if not request(c['socket'],{'op':'projects'}).get('ok'):raise ValueError('Gateway project request failed')
    for value in [{'op':'audit'},{'op':'project-register','name':'denied','repo':'/tmp'}, {'op':'project-checks','id':'default','dependencies':'/tmp'}, {'op':'project-create','name':'denied','repo':'/tmp'}]:
        if request(c['socket'],value).get('ok'):raise ValueError('Gateway accepted an administrative request')
    print('Gateway boundary verified: browser reads allowed; private files and administrative operations denied.')

if __name__=='__main__':probe(sys.argv[1],sys.argv[2],sys.argv[3:])
