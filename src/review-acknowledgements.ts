import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

const fileKind = "large-review-file-v1",
  pageKind = "large-review-page-v1";

type FilePlan = { tree: string; file: string; fingerprint: string };
type PagePlan = {
  tree: string;
  file: string;
  page: number;
  pages: number;
  fileFingerprint: string;
  pageFingerprint: string;
};

function validFilePlan(value: unknown): value is FilePlan {
  const plan = value as FilePlan;
  return (
    !!plan &&
    typeof plan === "object" &&
    /^[a-f0-9]{40}$/.test(plan.tree) &&
    typeof plan.file === "string" &&
    !!plan.file &&
    Buffer.byteLength(plan.file) <= 1024 &&
    !plan.file.includes("\0") &&
    /^[a-f0-9]{64}$/.test(plan.fingerprint)
  );
}

function validPagePlan(value: unknown): value is PagePlan {
  const plan = value as PagePlan;
  return (
    !!plan &&
    typeof plan === "object" &&
    /^[a-f0-9]{40}$/.test(plan.tree) &&
    typeof plan.file === "string" &&
    !!plan.file &&
    Buffer.byteLength(plan.file) <= 1024 &&
    !plan.file.includes("\0") &&
    Number.isSafeInteger(plan.page) &&
    Number.isSafeInteger(plan.pages) &&
    plan.page >= 0 &&
    plan.pages > 1 &&
    plan.page < plan.pages &&
    /^[a-f0-9]{64}$/.test(plan.fileFingerprint) &&
    /^[a-f0-9]{64}$/.test(plan.pageFingerprint)
  );
}

function id(task: string, tree: string, file: string) {
  return (
    "large-review-file:" +
    createHash("sha256")
      .update(task)
      .update("\0")
      .update(tree)
      .update("\0")
      .update(file)
      .digest("hex")
  );
}

export function acknowledgedReviewFiles(
  db: DatabaseSync,
  task: string,
  tree: string,
  files: string[],
) {
  if (!/^[a-f0-9]{40}$/.test(tree)) return [];
  const allowed = new Set(files);
  return db
    .prepare(
      "SELECT plan FROM review_jobs WHERE kind=? AND task=? AND state='acknowledged' ORDER BY rowid",
    )
    .all(fileKind, task)
    .flatMap((row: any) => {
      try {
        const plan = JSON.parse(String(row.plan));
        return validFilePlan(plan) && plan.tree === tree && allowed.has(plan.file)
          ? [plan.file]
          : [];
      } catch {
        return [];
      }
    });
}

export function acknowledgeReviewFile(db: DatabaseSync, task: string, plan: FilePlan) {
  if (!validFilePlan(plan)) throw Error("Invalid file review acknowledgement");
  const key = id(task, plan.tree, plan.file),
    encoded = JSON.stringify(plan),
    existing = db.prepare("SELECT * FROM review_jobs WHERE id=?").get(key) as any;
  if (existing) {
    if (
      existing.kind !== fileKind ||
      existing.task !== task ||
      existing.state !== "acknowledged" ||
      existing.plan !== encoded
    )
      throw Error("Stored file review acknowledgement is inconsistent");
    return false;
  }
  db.prepare("INSERT INTO review_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
    key,
    fileKind,
    task,
    null,
    "acknowledged",
    encoded,
    null,
    null,
    null,
    new Date().toISOString(),
    null,
  );
  return true;
}

function pageID(task: string, tree: string, file: string, page: number) {
  return (
    "large-review-page:" +
    createHash("sha256")
      .update(task)
      .update("\0")
      .update(tree)
      .update("\0")
      .update(file)
      .update("\0")
      .update(String(page))
      .digest("hex")
  );
}

export function acknowledgeReviewPage(db: DatabaseSync, task: string, plan: PagePlan) {
  if (!validPagePlan(plan)) throw Error("Invalid review page acknowledgement");
  const key = pageID(task, plan.tree, plan.file, plan.page),
    encoded = JSON.stringify(plan),
    existing = db.prepare("SELECT * FROM review_jobs WHERE id=?").get(key) as any;
  if (existing) {
    if (
      existing.kind !== pageKind ||
      existing.task !== task ||
      existing.state !== "acknowledged" ||
      existing.plan !== encoded
    )
      throw Error("Stored review page acknowledgement is inconsistent");
    return false;
  }
  db.prepare("INSERT INTO review_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
    key,
    pageKind,
    task,
    null,
    "acknowledged",
    encoded,
    null,
    null,
    null,
    new Date().toISOString(),
    null,
  );
  return true;
}

export function acknowledgedReviewPages(
  db: DatabaseSync,
  task: string,
  expected: Pick<PagePlan, "tree" | "file" | "pages" | "fileFingerprint">,
) {
  return db
    .prepare(
      "SELECT plan FROM review_jobs WHERE kind=? AND task=? AND state='acknowledged' ORDER BY rowid",
    )
    .all(pageKind, task)
    .flatMap((row: any) => {
      try {
        const plan = JSON.parse(String(row.plan));
        return validPagePlan(plan) &&
          plan.tree === expected.tree &&
          plan.file === expected.file &&
          plan.pages === expected.pages &&
          plan.fileFingerprint === expected.fileFingerprint
          ? [plan.page]
          : [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a - b);
}

export function paginatedReviewProgress(
  db: DatabaseSync,
  task: string,
  tree: string,
  files: string[],
) {
  const allowed = new Set(files),
    groups = new Map<
      string,
      { pages: number; fingerprint: string; acknowledged: Set<number>; valid: boolean }
    >();
  for (const row of db
    .prepare(
      "SELECT plan FROM review_jobs WHERE kind=? AND task=? AND state='acknowledged' ORDER BY rowid",
    )
    .all(pageKind, task) as any[]) {
    try {
      const plan = JSON.parse(String(row.plan));
      if (!validPagePlan(plan) || plan.tree !== tree || !allowed.has(plan.file)) continue;
      const group = groups.get(plan.file) ?? {
        pages: plan.pages,
        fingerprint: plan.fileFingerprint,
        acknowledged: new Set<number>(),
        valid: true,
      };
      if (group.pages !== plan.pages || group.fingerprint !== plan.fileFingerprint)
        group.valid = false;
      group.acknowledged.add(plan.page);
      groups.set(plan.file, group);
    } catch {
      // Invalid stored evidence is never returned as review coverage.
    }
  }
  return Object.fromEntries(
    [...groups]
      .filter(([, value]) => value.valid)
      .map(([file, value]) => [
        file,
        {
          pages: value.pages,
          acknowledged: [...value.acknowledged].sort((a, b) => a - b),
        },
      ]),
  );
}
