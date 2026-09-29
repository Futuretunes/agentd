import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

const kind = "large-review-file-v1";

type Plan = { tree: string; file: string; fingerprint: string };

function validPlan(value: unknown): value is Plan {
  const plan = value as Plan;
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
    .all(kind, task)
    .flatMap((row: any) => {
      try {
        const plan = JSON.parse(String(row.plan));
        return validPlan(plan) && plan.tree === tree && allowed.has(plan.file)
          ? [plan.file]
          : [];
      } catch {
        return [];
      }
    });
}

export function acknowledgeReviewFile(db: DatabaseSync, task: string, plan: Plan) {
  if (!validPlan(plan)) throw Error("Invalid file review acknowledgement");
  const key = id(task, plan.tree, plan.file),
    encoded = JSON.stringify(plan),
    existing = db.prepare("SELECT * FROM review_jobs WHERE id=?").get(key) as any;
  if (existing) {
    if (
      existing.kind !== kind ||
      existing.task !== task ||
      existing.state !== "acknowledged" ||
      existing.plan !== encoded
    )
      throw Error("Stored file review acknowledgement is inconsistent");
    return false;
  }
  db.prepare("INSERT INTO review_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
    key,
    kind,
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
