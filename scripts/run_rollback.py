#!/usr/bin/env python3
"""Roll back to an older application and its matching task state.

Started as agentd-rollback@<version>.service (newest older compatible managed backup)
or agentd-restore@<backup-id>.service (a specific older compatible managed backup).
The older release must accept the current deployment configuration (checked by running
its own configuration validator). The current application and state are saved to a new
managed backup first, so a restore never deletes data; any failure restores what was
running. Native credential profiles outside the task state are never touched.
"""
import argparse,fcntl,json,os,re,shutil,subprocess,sys,tempfile,time
from datetime import datetime,timezone
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import update
import backup_retention
import run_approved_update as job

def compatible(app,config_path,runner=subprocess.run):
    # The restored release must still understand today's update.json and units.
    check=('import sys;sys.dont_write_bytecode=True;sys.path.insert(0,sys.argv[1]);'
           'import update;update.config(update.canonical(sys.argv[2]))')
    result=runner(['/usr/bin/python3','-B','-c',check,str(Path(app)/'scripts'),str(config_path)],
                  stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=20)
    return result.returncode==0

def candidate(c,installed,config_path,runner=subprocess.run):
    """Newest completed managed backup with an older release, or None with a reason."""
    for item in backup_retention.records(c,measure=False):
        path=Path(item['path'])
        try:manifest=json.loads((path/'app'/'release-manifest.json').read_text())
        except (OSError,ValueError):continue
        try:older=job.version_key(manifest['version'])<job.version_key(installed['version'])
        except (KeyError,ValueError):continue
        if not older:continue
        if not compatible(path/'app',config_path,runner):
            return None,'The previous version does not support the current server configuration.'
        return {'path':str(path),'version':manifest['version'],'revision':manifest['revision'],
                'taskSchemaVersion':manifest['taskSchemaVersion'],'manifest':manifest,
                'backupId':path.name,
                'completedAt':datetime.fromtimestamp(item['completed'],timezone.utc).isoformat(timespec='seconds')},None
    return None,'No earlier version backup is available.'

BACKUP_ID=re.compile(r'agentd-backup-[a-z0-9_]{4,32}')

def by_id(c,installed,config_path,backup_id,runner=subprocess.run):
    """One specific older compatible managed backup, or None with a reason."""
    if not isinstance(backup_id,str) or not BACKUP_ID.fullmatch(backup_id):
        return None,'Invalid backup id'
    # Confirm it is a recorded managed backup (not an arbitrary directory).
    known={Path(item['path']).name:item for item in backup_retention.records(c,measure=False)}
    item=known.get(backup_id)
    if not item:return None,'That managed backup is not available.'
    root=Path(item['path'])
    if root.is_symlink() or not root.is_dir() or root.parent!=Path(c['app']).parent:
        return None,'That managed backup is not available.'
    try:manifest=json.loads((root/'app'/'release-manifest.json').read_text())
    except (OSError,ValueError):
        return None,'That managed backup is incomplete.'
    try:
        if job.version_key(manifest['version'])>=job.version_key(installed['version']):
            return None,'Only an older managed backup can be restored.'
    except (KeyError,ValueError):
        return None,'That managed backup has an invalid version.'
    if not compatible(root/'app',config_path,runner):
        return None,'That backup does not support the current server configuration.'
    return {'path':str(root),'version':manifest['version'],'revision':manifest['revision'],
            'taskSchemaVersion':manifest['taskSchemaVersion'],'manifest':manifest,
            'backupId':backup_id,
            'completedAt':datetime.fromtimestamp(item['completed'],timezone.utc).isoformat(timespec='seconds')},None

def restorable(c,installed,config_path,runner=subprocess.run):
    """Backup directory names that can be restored independently of the default target."""
    ids=set()
    for item in backup_retention.records(c,measure=False):
        path=Path(item['path']);name=path.name
        if not BACKUP_ID.fullmatch(name):continue
        try:manifest=json.loads((path/'app'/'release-manifest.json').read_text())
        except (OSError,ValueError):continue
        try:older=job.version_key(manifest['version'])<job.version_key(installed['version'])
        except (KeyError,ValueError):continue
        if older and compatible(path/'app',config_path,runner):ids.add(name)
    return ids

def run(version,config_path,runner=subprocess.run,backup_id=None):
    c=update.config(update.canonical(config_path));deployment=Path(c['deployment'])
    app,state=Path(c['app']),Path(c['state'])
    services=[s for s in (c.get('adminUnit'),c['runnerUnit'],c['mobileUnit']) if s]
    started=datetime.now(timezone.utc).isoformat();progress={'stage':'verifying'}
    def status(stage,result='running',**extra):
        progress['stage']=stage
        job.write_status(deployment/job.STATUS,{'format':1,'kind':'rollback','version':version,'stage':stage,'state':result,
          'message':job.STAGES[stage],'startedAt':started,'updatedAt':datetime.now(timezone.utc).isoformat(),**extra})
    status('verifying')
    changed=False;moved=[];journal=deployment/'rollback-pending.json'
    try:
        with (deployment/'update.lock').open('w') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            if any(deployment.glob('*pending.json')):raise ValueError('An interrupted update needs administrator recovery first')
            record=json.loads((deployment/'installed.json').read_text());installed=record['release']
            current=update.inventory(c)
            if current!=record['configuration']:raise ValueError('Installed configuration drifted')
            if backup_id:
                target,reason=by_id(c,installed,config_path,backup_id,runner)
            else:
                target,reason=candidate(c,installed,config_path,runner)
            if not target:raise ValueError(reason)
            if target['version']!=version:raise ValueError('The rollback target changed; review it again')
            if backup_id and target.get('backupId')!=backup_id:
                raise ValueError('The selected backup changed; review it again')
            update.same_filesystem(c)
            schema=max(installed['taskSchemaVersion'],target['taskSchemaVersion'])
            update.control_idle(c);update.idle(state,schema)
            saved=Path(tempfile.mkdtemp(prefix='agentd-backup-',dir=app.parent))
            job.write_status(journal,{'saved':str(saved),'source':target['path'],'from':installed['version'],'to':version,'backupId':target.get('backupId')})
            status('restoring')
            update.run(['systemctl','stop',c['mobileUnit']]);update.control_idle(c);update.idle(state,schema)
            update.run(['systemctl','stop',c['runnerUnit'],*([c['adminUnit']] if c.get('adminUnit') else [])])
            update.idle(state,schema)
            if update.inventory(c)!=current:raise ValueError('Configuration changed while preparing rollback')
            changed=True
            # Keep what was running (moved, not copied) and restore copies so the
            # source backup stays available.
            app.rename(saved/'app');moved.append(('app',app))
            state.rename(saved/'state');moved.append(('state',state))
            shutil.copytree(Path(target['path'])/'app',app,symlinks=True)
            update.copy_state(Path(target['path'])/'state',state)
            job.write_status(deployment/'installed.json',dict(record,release=target['manifest']))
            for unit in services:update.run(['systemctl','start',unit])
            update.ready(c,target['manifest']);update.run(['systemctl','is-active','--quiet',*services])
            if update.inventory(c)!=current:raise ValueError('Configuration changed during rollback')
            backup_retention.completed(c,saved,record)
            # The restore is complete and recorded: nothing is left to recover.
            journal.unlink(missing_ok=True)
            status('verifying_services')
            for flag,script in (('resourceProfile','apply_resources.py'),('gatewayHardening','apply_gateway_hardening.py'),('adminUnit','apply_diagnostics.py')):
                path=app/'scripts'/script
                if c.get(flag) and path.exists():
                    runner(['/usr/bin/python3','-B',str(path),'--config',config_path],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
        status('succeeded','succeeded',revision=target['revision'][:12],savedVersion=installed['version'],backupId=target.get('backupId'))
    except Exception:
        if changed and progress['stage']=='restoring':
            # Put back exactly what was running, then restart it.
            update.run(['systemctl','stop',*reversed(services)])
            for name,live in moved:
                if live.exists():live.rename(saved/('failed-'+name))
                (saved/name).rename(live)
            job.write_status(deployment/'installed.json',record)
            for unit in services:
                # Best effort per unit: start everything that can start again.
                try:update.run(['systemctl','start',unit])
                except Exception:pass
        elif not changed:journal.unlink(missing_ok=True)
        status('failed','failed',failedStage=progress['stage'])
        raise

def version_for_backup(config_path,backup_id):
    c=update.config(update.canonical(config_path))
    target,reason=by_id(c,json.loads((Path(c['deployment'])/'installed.json').read_text())['release'],config_path,backup_id)
    if not target:raise ValueError(reason)
    return target['version']

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version')
    parser.add_argument('--backup-id')
    parser.add_argument('--config',default='/etc/agentd/update.json');a=parser.parse_args()
    try:
        if os.geteuid()!=0:raise ValueError('Administrator required')
        if a.backup_id and not a.version:version=version_for_backup(a.config,a.backup_id)
        elif a.version:version=a.version
        else:raise ValueError('Version or backup id required')
        job.version_key(version);run(version,a.config,backup_id=a.backup_id)
    except Exception as error:
        print('Rollback failed; inspect local logs.' if isinstance(error,subprocess.CalledProcessError) else str(error),file=sys.stderr)
        sys.exit(1)
