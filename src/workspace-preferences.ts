import type { DatabaseSync } from "node:sqlite";

export type WorkspacePreferences = {
  theme: "system" | "light" | "dark";
  density: "comfortable" | "compact";
  defaultAdapter: "claude" | "codex" | "cursor";
  defaultMode: "ask" | "edit" | "chat";
  defaultModel: string;
  defaultEffort: string;
  deleteTiming: "immediate" | "grace";
  deleteGraceDays: number;
  drawerAutoClose: boolean;
  noticeInfoMs: number;
  noticeErrorMs: number;
};

export const defaultWorkspacePreferences = (): WorkspacePreferences => ({
  theme: "system",
  density: "comfortable",
  defaultAdapter: "claude",
  defaultMode: "ask",
  defaultModel: "provider",
  defaultEffort: "provider",
  deleteTiming: "immediate",
  deleteGraceDays: 7,
  drawerAutoClose: true,
  noticeInfoMs: 5000,
  noticeErrorMs: 8000,
});

export function ensureWorkspacePreferencesSchema(db: DatabaseSync) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS workspace_preferences(id INTEGER PRIMARY KEY CHECK (id = 1), value TEXT NOT NULL, updated TEXT NOT NULL)",
  );
}

export function readWorkspacePreferences(db: DatabaseSync): WorkspacePreferences {
  ensureWorkspacePreferencesSchema(db);
  const row = db.prepare("SELECT value FROM workspace_preferences WHERE id=1").get() as
    | { value: string }
    | undefined;
  if (!row) return defaultWorkspacePreferences();
  try {
    return normalizeWorkspacePreferences(JSON.parse(row.value));
  } catch {
    return defaultWorkspacePreferences();
  }
}

export function writeWorkspacePreferences(
  db: DatabaseSync,
  value: unknown,
): WorkspacePreferences {
  const prefs = normalizeWorkspacePreferences(value);
  ensureWorkspacePreferencesSchema(db);
  db.prepare(
    "INSERT INTO workspace_preferences(id,value,updated) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated=excluded.updated",
  ).run(JSON.stringify(prefs), new Date().toISOString());
  return prefs;
}

export function normalizeWorkspacePreferences(value: unknown): WorkspacePreferences {
  const base = defaultWorkspacePreferences();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const input = value as Record<string, unknown>;
  if (["system", "light", "dark"].includes(String(input.theme)))
    base.theme = input.theme as WorkspacePreferences["theme"];
  if (["comfortable", "compact"].includes(String(input.density)))
    base.density = input.density as WorkspacePreferences["density"];
  if (["claude", "codex", "cursor"].includes(String(input.defaultAdapter)))
    base.defaultAdapter = input.defaultAdapter as WorkspacePreferences["defaultAdapter"];
  if (["ask", "edit", "chat"].includes(String(input.defaultMode)))
    base.defaultMode = input.defaultMode as WorkspacePreferences["defaultMode"];
  if (
    typeof input.defaultModel === "string" &&
    /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(input.defaultModel)
  )
    base.defaultModel = input.defaultModel;
  if (
    typeof input.defaultEffort === "string" &&
    ["auto", "provider", "none", "low", "medium", "high", "xhigh", "max", "ultra"].includes(
      input.defaultEffort,
    )
  )
    base.defaultEffort = input.defaultEffort;
  if (["immediate", "grace"].includes(String(input.deleteTiming)))
    base.deleteTiming = input.deleteTiming as WorkspacePreferences["deleteTiming"];
  if (
    Number.isInteger(input.deleteGraceDays) &&
    Number(input.deleteGraceDays) >= 1 &&
    Number(input.deleteGraceDays) <= 90
  )
    base.deleteGraceDays = Number(input.deleteGraceDays);
  if (typeof input.drawerAutoClose === "boolean")
    base.drawerAutoClose = input.drawerAutoClose;
  if (
    Number.isInteger(input.noticeInfoMs) &&
    Number(input.noticeInfoMs) >= 1000 &&
    Number(input.noticeInfoMs) <= 60000
  )
    base.noticeInfoMs = Number(input.noticeInfoMs);
  if (
    Number.isInteger(input.noticeErrorMs) &&
    Number(input.noticeErrorMs) >= 1000 &&
    Number(input.noticeErrorMs) <= 120000
  )
    base.noticeErrorMs = Number(input.noticeErrorMs);
  return base;
}

export function purgeAtFromPreferences(prefs: WorkspacePreferences, now = new Date()) {
  if (prefs.deleteTiming === "immediate") return now.toISOString();
  const when = new Date(now.getTime() + prefs.deleteGraceDays * 86400000);
  return when.toISOString();
}
