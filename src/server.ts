import { runner } from './runner.ts';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

type Options = { stateDir: string; port: number; taskRunner?: boolean };
export function start(options: Options) {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error('Invalid port');
  mkdirSync(options.stateDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(options.stateDir, 'agentd.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS service_events (id INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL);
    INSERT OR IGNORE INTO metadata VALUES ('schema_version', '1');`);
  const schema = db.prepare('SELECT value FROM metadata WHERE key = ?').get('schema_version');
  if (schema?.value !== '1') { db.close(); throw new Error('Unsupported state schema'); }
  db.prepare('INSERT INTO service_events(at, kind) VALUES (?, ?)').run(new Date().toISOString(), 'started');
  const boots = Number(db.prepare("SELECT count(*) AS n FROM service_events WHERE kind = 'started'").get()?.n);
  const tasks = options.taskRunner ? runner({ editing: process.env.AGENTD_EDITING === '1', editAdapters: (process.env.AGENTD_EDIT_ADAPTERS??'').split(',').filter(Boolean), enabledAdapters: (process.env.AGENTD_ENABLED_ADAPTERS??'codex,claude').split(',').filter(Boolean), strictWorkers: process.env.AGENTD_STRICT_WORKERS === '1', stateDir: options.stateDir, projectsDir: process.env.AGENTD_PROJECTS_DIR, repo: process.env.AGENTD_REPO ?? (() => { throw new Error('AGENTD_REPO is required when the runner is enabled'); })(), worktrees: process.env.AGENTD_WORKTREES ?? join(options.stateDir, 'worktrees'), logs: process.env.AGENTD_LOGS ?? join(options.stateDir, 'logs') }) : undefined;
  const started = performance.now();
  let requests = 0;
  const server = createServer((req, res) => {
    requests++;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); res.end(); return; }
    const path = req.url?.split('?')[0];
    if (path === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
      res.end(`# HELP agentd_uptime_seconds Time since daemon startup\n# TYPE agentd_uptime_seconds gauge\nagentd_uptime_seconds ${(performance.now() - started) / 1000}\n# HELP agentd_http_requests_total Requests since daemon startup\n# TYPE agentd_http_requests_total counter\nagentd_http_requests_total ${requests}\n# HELP agentd_startups_total Recorded daemon starts\n# TYPE agentd_startups_total counter\nagentd_startups_total ${boots}\n`);
      return;
    }
    if (path === '/healthz' || path === '/readyz' || path === '/v1/status') {
      try {
        db.prepare('SELECT 1').get();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'agentd', version: '0.6.0', schemaVersion: 1,
          scheduler: tasks ? 'serial' : 'disabled', workerDispatch: !!tasks, starts: boots }));
      } catch {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unavailable' }));
      }
      return;
    }
    res.writeHead(404); res.end();
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.listen(options.port, '127.0.0.1');
  const close = async () => {
    await tasks?.close();
    return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      db.close();
      if (error) reject(error); else resolve();
    });
    server.closeIdleConnections();
  });
  };
  return { server, close };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.umask(0o077);
  const app = start({ stateDir: process.env.AGENTD_STATE_DIR ?? '/srv/agentd/state', port: Number(process.env.AGENTD_PORT ?? 8787), taskRunner: process.env.AGENTD_RUNNER === "1" });
  app.server.on('listening', () => console.log(JSON.stringify({ event: 'listening', address: app.server.address(), version: '0.6.0' })));
  app.server.on('error', (error) => { console.error(JSON.stringify({ event: 'server_error', message: error.message })); process.exit(1); });
  let stopping = false;
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000); timer.unref();
    app.close().then(() => { clearTimeout(timer); console.log(JSON.stringify({ event: 'stopped' })); }, () => process.exit(1));
  });
}
