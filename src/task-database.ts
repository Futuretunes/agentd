import { DatabaseSync } from "node:sqlite";

// Version 0 is the historical, unversioned schema. Never infer compatibility
// from CREATE IF NOT EXISTS: a newer deployment must not be opened by this code.
export const TASK_SCHEMA_VERSION = 2;

export function taskSchemaVersion(db: DatabaseSync): number {
  return Number(db.prepare("PRAGMA user_version").get()?.user_version);
}

function transaction(db: DatabaseSync, operation: () => void) {
  db.exec("BEGIN IMMEDIATE");
  try {
    operation();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function baseline(db: DatabaseSync, repo: string) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, adapter TEXT NOT NULL, prompt TEXT NOT NULL, revision TEXT NOT NULL, status TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL, worktree TEXT, log TEXT, error TEXT);
  CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,task TEXT,status TEXT,at TEXT);`);
  const columns = db
    .prepare("PRAGMA table_info(tasks)")
    .all()
    .map((x) => x.name);
  if (!columns.includes("attachments"))
    db.exec("ALTER TABLE tasks ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'");
  if (!columns.includes("parent")) db.exec("ALTER TABLE tasks ADD COLUMN parent TEXT");
  for (const name of ["revision_of", "seed_tree", "merge_parent", "conflict_paths"])
    if (!columns.includes(name)) db.exec(`ALTER TABLE tasks ADD COLUMN ${name} TEXT`);
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS tasks_revision_of ON tasks(revision_of) WHERE revision_of IS NOT NULL",
  );
  if (!columns.includes("retry_of"))
    db.exec("ALTER TABLE tasks ADD COLUMN retry_of TEXT");
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS tasks_retry_of ON tasks(retry_of) WHERE retry_of IS NOT NULL",
  );
  if (!columns.includes("project")) db.exec("ALTER TABLE tasks ADD COLUMN project TEXT");
  if (!columns.includes("conversation"))
    db.exec("ALTER TABLE tasks ADD COLUMN conversation TEXT");
  db.exec(`CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT NOT NULL, repo TEXT NOT NULL UNIQUE, created TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY, project TEXT NOT NULL, title TEXT NOT NULL, created TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);`);
  for (const [name, definition] of Object.entries({
    mode: "TEXT NOT NULL DEFAULT 'ask'",
    review: "TEXT",
    commit_sha: "TEXT",
    branch: "TEXT",
    checks: "TEXT",
  })) {
    if (!columns.includes(name))
      db.exec(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`);
  }
  for (const name of ["execution", "run_overrides", "settings_error", "restart_of"])
    if (!columns.includes(name)) db.exec(`ALTER TABLE tasks ADD COLUMN ${name} TEXT`);
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS tasks_restart_of ON tasks(restart_of) WHERE restart_of IS NOT NULL",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS execution_settings(scope TEXT,scope_id TEXT,agent TEXT,settings TEXT,updated TEXT,PRIMARY KEY(scope,scope_id,agent))",
  );
  const projectColumns = db
    .prepare("PRAGMA table_info(projects)")
    .all()
    .map((x) => x.name);
  for (const name of [
    "check_dependencies",
    "check_lock",
    "github_url",
    "github_branch",
    "check_manifest",
  ])
    if (!projectColumns.includes(name))
      db.exec(`ALTER TABLE projects ADD COLUMN ${name} TEXT`);
  db.exec(
    "CREATE TABLE IF NOT EXISTS repository_jobs(id TEXT PRIMARY KEY,kind TEXT,state TEXT,project TEXT,source TEXT,branch TEXT,result TEXT,error TEXT,updated TEXT)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS dependency_jobs(id TEXT PRIMARY KEY,project TEXT,task TEXT,fingerprint TEXT,state TEXT,error TEXT,updated TEXT)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS publications(id TEXT PRIMARY KEY,task TEXT,owner TEXT,state TEXT,plan TEXT,error TEXT,url TEXT,updated TEXT,expires INTEGER)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS review_jobs(id TEXT PRIMARY KEY,kind TEXT,task TEXT,owner TEXT,state TEXT,plan TEXT,error TEXT,result TEXT,selection TEXT,updated TEXT,expires INTEGER)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL, task TEXT, detail TEXT)",
  );
  const defaultRepo = repo;
  db.prepare("INSERT OR IGNORE INTO projects(id,name,repo,created) VALUES(?,?,?,?)").run(
    "default",
    "Original workspace",
    defaultRepo,
    new Date().toISOString(),
  );
  db.prepare("UPDATE tasks SET project='default' WHERE project IS NULL").run();
  const migrate = (row: any, seen = new Set<string>()): string => {
    if (row.conversation) return String(row.conversation);
    if (seen.has(String(row.id))) throw new Error("Invalid task ancestry");
    seen.add(String(row.id));
    const parent = row.parent
      ? db.prepare("SELECT * FROM tasks WHERE id=?").get(String(row.parent))
      : undefined;
    const id = parent ? migrate(parent, seen) : String(row.id);
    db.prepare(
      "INSERT OR IGNORE INTO conversations(id,project,title,created) VALUES(?,?,?,?)",
    ).run(id, row.project, String(row.prompt).slice(0, 100), row.created);
    db.prepare("UPDATE tasks SET conversation=? WHERE id=?").run(id, row.id);
    return id;
  };
  for (const row of db
    .prepare("SELECT * FROM tasks WHERE conversation IS NULL ORDER BY created,id")
    .all())
    migrate(row);
}

function creationSchema(db: DatabaseSync) {
  db.exec(
    `CREATE TABLE creation_requests(scope TEXT NOT NULL,request_id TEXT NOT NULL,operation TEXT NOT NULL,payload_hash TEXT NOT NULL,result_id TEXT NOT NULL,created TEXT NOT NULL,PRIMARY KEY(scope,request_id))`,
  );
}

// Check table/column/index definitions against the canonical migrated baseline.
// Legacy nullable columns are retained by baseline() for compatibility; required
// column presence, types and primary keys must still agree.
function validate(db: DatabaseSync, version = TASK_SCHEMA_VERSION) {
  const expected = new DatabaseSync(":memory:");
  try {
    baseline(expected, "/schema-fixture");
    if (version >= 2) creationSchema(expected);
    if (
      version >= 2 &&
      db.prepare("SELECT sql FROM sqlite_master WHERE name='creation_requests'").get()
        ?.sql !==
        expected
          .prepare("SELECT sql FROM sqlite_master WHERE name='creation_requests'")
          .get()?.sql
    )
      throw Error("Invalid creation receipt schema");
    const tables = expected
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all();
    const actualNames = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all()
      .map((row) => row.name);
    if (actualNames.length !== tables.length)
      throw Error("Unrecognized task schema tables");
    for (const { name } of tables) {
      const columns = (database: DatabaseSync) =>
        database
          .prepare(`PRAGMA table_info(${name})`)
          .all()
          .map((row) => [row.name, row.type, row.pk]);
      if (JSON.stringify(columns(db).sort()) !== JSON.stringify(columns(expected).sort()))
        throw Error(`Invalid task schema: ${name}`);
    }
    for (const { name, sql } of expected
      .prepare(
        "SELECT name,sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL",
      )
      .all()) {
      const actual = db
        .prepare("SELECT sql FROM sqlite_master WHERE type='index' AND name=?")
        .get(name!);
      if (actual?.sql !== sql) throw Error(`Invalid task schema index: ${name}`);
    }
    if (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type IN ('trigger','view') LIMIT 1",
        )
        .get()
    )
      throw Error("Unrecognized task schema objects");
  } finally {
    expected.close();
  }
}

export function initializeTaskDatabase(db: DatabaseSync, repo: string) {
  const version = taskSchemaVersion(db);
  if (!Number.isInteger(version) || version < 0 || version > TASK_SCHEMA_VERSION) {
    throw Error(
      `Unsupported task schema version ${version}; supported through ${TASK_SCHEMA_VERSION}`,
    );
  }
  db.exec("PRAGMA busy_timeout=5000");
  transaction(db, () => {
    // Recheck after acquiring the write lock, before applying any changes.
    if (taskSchemaVersion(db) !== version)
      throw Error("Task schema changed during startup");
    if (version === 0) baseline(db, repo);
    if (version < 2) {
      validate(db, 1);
      creationSchema(db);
    }
    validate(db);
    recover(db);
    db.exec(`PRAGMA user_version=${TASK_SCHEMA_VERSION}`);
  });
  db.exec("PRAGMA journal_mode=WAL");
}

function recover(db: DatabaseSync) {
  db.exec(
    "UPDATE tasks SET status='interrupted',error='Service stopped before completion' WHERE status IN ('running','cancelling')",
  );
  db.exec(
    "UPDATE tasks SET review='pending' WHERE mode='edit' AND worktree IS NOT NULL AND review IS NULL AND status IN ('interrupted','failed','cancelled','timed_out','succeeded')",
  );
  // Old check results may have consumed ignored files. Never reuse them as exact-tree evidence.
  db.exec(
    "UPDATE tasks SET checks=json_set(checks,'$.status','stale') WHERE json_valid(checks) AND json_extract(checks,'$.status')='passed' AND coalesce(json_extract(checks,'$.input'),'')!='git-tree-v1'",
  );
  db.prepare(
    "UPDATE tasks SET checks=? WHERE json_extract(checks,'$.status')='running'",
  ).run(JSON.stringify({ status: "interrupted" }));
  db.prepare(
    "UPDATE repository_jobs SET state='interrupted',error='Service stopped. Start this operation again.' WHERE state='running'",
  ).run();
  db.exec(
    "UPDATE dependency_jobs SET state='interrupted',error='Service restarted. Prepare dependencies again.' WHERE state='running'",
  );
  db.exec(
    "UPDATE publications SET state='needs_attention',error='Service stopped during publication. GitHub may already contain the branch or PR. Preview again to reconcile.' WHERE state IN ('publishing','pushing','branch_published','creating_pr')",
  );
  db.exec(
    "UPDATE publications SET state='expired',error='Service restarted. Create a fresh preview.' WHERE state IN ('preparing','ready')",
  );
  db.exec(
    "UPDATE review_jobs SET state='expired',error='Service restarted. Prepare a fresh preview.' WHERE state IN ('preparing','ready')",
  );
  db.exec(
    "UPDATE review_jobs SET state='interrupted',error='Service stopped while creating the integration review. Approve again to reconcile it.' WHERE state='applying'",
  );
}
