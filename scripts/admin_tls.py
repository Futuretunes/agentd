#!/usr/bin/env python3
"""Read TLS certificate metadata or replace the managed gateway certificate and key."""
import json,os,re,subprocess,sys,tempfile
from datetime import datetime,timezone
from pathlib import Path

CERT_PATH=Path('/etc/agentd-web/tls.crt')
KEY_PATH=Path('/etc/agentd-web/tls.key')
MAX_PEM=16384

def resolve_openssl():
    candidates=[]
    for path in ('/usr/bin/openssl','/opt/homebrew/bin/openssl','/usr/local/bin/openssl'):
        if Path(path).is_file():candidates.append(path)
    for path in candidates:
        try:
            text=subprocess.run([path,'version'],check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5).stdout
            if 'LibreSSL' in text:continue
            return path
        except (OSError,subprocess.SubprocessError):
            continue
    return candidates[0] if candidates else 'openssl'

OPENSSL=resolve_openssl()
CERT_BEGIN=re.compile(r'-----BEGIN CERTIFICATE-----\n[\sA-Za-z0-9+/=\n]+-----END CERTIFICATE-----\n?\Z')
KEY_BEGIN=re.compile(r'-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----\n[\sA-Za-z0-9+/=\n]+-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----\n?\Z')

def run(*args):
    return subprocess.run((OPENSSL,*args),check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=5,env={'PATH':'/usr/bin:/bin:/opt/homebrew/bin:/usr/local/bin','LANG':'C'})

def check_key(path):
    try:
        run('pkey','-in',str(path),'-check','-noout')
    except subprocess.CalledProcessError:
        try:
            run('rsa','-in',str(path),'-check','-noout')
        except subprocess.CalledProcessError:
            run('ec','-in',str(path),'-check','-noout')

def field(text,prefix):
    for line in text.splitlines():
        if line.startswith(prefix):
            return line[len(prefix):].strip()[:128]
    return None

def fingerprint_value(text):
    for line in text.splitlines():
        lower=line.lower()
        if lower.startswith('sha256 fingerprint='):
            value=line.split('=',1)[1].strip().replace(':','').lower()
            return value if re.fullmatch(r'[a-f0-9]{64}',value) else None
    return None

def metadata(cert=CERT_PATH):
    empty={'certificateExpires':None,'subject':None,'issuer':None,'fingerprintSha256':None,'daysRemaining':None}
    if not cert.is_file() or cert.is_symlink():return empty
    info=cert.lstat()
    if info.st_size>MAX_PEM or info.st_size<1:return empty
    try:
        end=field(run('x509','-in',str(cert),'-noout','-enddate').stdout,'notAfter=')
        subject=field(run('x509','-in',str(cert),'-noout','-subject').stdout,'subject=')
        issuer=field(run('x509','-in',str(cert),'-noout','-issuer').stdout,'issuer=')
        fingerprint=fingerprint_value(run('x509','-in',str(cert),'-noout','-fingerprint','-sha256').stdout)
        days=None
        if end:
            # OpenSSL default date form: Mon DD HH:MM:SS YYYY GMT
            try:
                expires=datetime.strptime(end,'%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
                days=max(-9999,min(9999,int((expires-datetime.now(timezone.utc)).total_seconds()//86400)))
            except ValueError:
                days=None
        return {
            'certificateExpires':end,
            'subject':subject,
            'issuer':issuer,
            'fingerprintSha256':fingerprint,
            'daysRemaining':days,
        }
    except (OSError,subprocess.SubprocessError,ValueError):
        return empty

def normalize_pem(value,kind):
    if not isinstance(value,str) or len(value)>MAX_PEM:raise ValueError('Invalid '+kind)
    text=value.replace('\r\n','\n').replace('\r','\n').strip()+'\n'
    pattern=CERT_BEGIN if kind=='certificate' else KEY_BEGIN
    if not pattern.fullmatch(text):raise ValueError('Invalid '+kind)
    if 'ENCRYPTED' in text:raise ValueError('Encrypted private keys are not supported')
    return text

def public_key(path,kind):
    if kind=='certificate':
        return run('x509','-in',str(path),'-pubkey','-noout').stdout
    return run('pkey','-in',str(path),'-pubout').stdout

def replace(certificate,key,cert_path=CERT_PATH,key_path=KEY_PATH,expected_uid=0):
    certificate=normalize_pem(certificate,'certificate')
    key=normalize_pem(key,'private key')
    for path in (cert_path,key_path):
        if path.is_symlink() or not path.is_file():raise ValueError('Managed TLS files are missing')
        info=path.lstat()
        if info.st_uid!=expected_uid or info.st_size>MAX_PEM:raise ValueError('Invalid TLS file')
    cert_info,key_info=cert_path.lstat(),key_path.lstat()
    directory=cert_path.parent
    if directory!=key_path.parent:raise ValueError('Certificate and key must share a directory')
    with tempfile.TemporaryDirectory(prefix='agentd-tls-',dir=str(directory)) as temporary:
        root=Path(temporary)
        cert_tmp,key_tmp=root/'tls.crt',root/'tls.key'
        cert_tmp.write_text(certificate);key_tmp.write_text(key)
        os.chmod(cert_tmp,0o600);os.chmod(key_tmp,0o600)
        run('x509','-in',str(cert_tmp),'-noout','-checkend','0')
        check_key(key_tmp)
        if public_key(cert_tmp,'certificate')!=public_key(key_tmp,'key'):
            raise ValueError('Certificate and private key do not match')
        final_cert=directory/f'.tls.crt.{os.getpid()}.tmp'
        final_key=directory/f'.tls.key.{os.getpid()}.tmp'
        try:
            final_cert.write_text(certificate);final_key.write_text(key)
            os.chown(final_cert,cert_info.st_uid,cert_info.st_gid);os.chmod(final_cert,cert_info.st_mode&0o777)
            os.chown(final_key,key_info.st_uid,key_info.st_gid);os.chmod(final_key,key_info.st_mode&0o777)
            final_cert.replace(cert_path);final_key.replace(key_path)
        finally:
            for item in (final_cert,final_key):
                try:item.unlink()
                except FileNotFoundError:pass
    value=metadata(cert_path)
    value['format']=1
    value['replaced']=True
    value['requiresRestart']=True
    return value

if __name__=='__main__':
    try:
        if len(sys.argv)==1:
            value=metadata();value['format']=1;print(json.dumps(value,separators=(',',':')))
        elif len(sys.argv)==2 and sys.argv[1].startswith('{'):
            request=json.loads(sys.argv[1])
            print(json.dumps(replace(request['certificate'],request['key']),separators=(',',':')))
        else:
            raise ValueError('Unsupported TLS request')
    except Exception:
        print(json.dumps({'format':1,'error':'TLS certificate change is unavailable.'},separators=(',',':')));sys.exit(1)
