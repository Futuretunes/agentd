import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initializeTaskDatabase } from "../src/task-database.ts";
import {
  acknowledgeReviewFile,
  acknowledgedReviewFiles,
} from "../src/review-acknowledgements.ts";

test("exact-tree file acknowledgements survive database restart and remain idempotent", () => {
  const root = mkdtempSync(join(tmpdir(), "review-ack-")),
    path = join(root, "tasks.sqlite"),
    task = "11111111-1111-4111-8111-111111111111",
    plan = {
      tree: "a".repeat(40),
      file: "src/example.ts",
      fingerprint: "b".repeat(64),
    };
  try {
    let db = new DatabaseSync(path);
    initializeTaskDatabase(db, root);
    assert.equal(acknowledgeReviewFile(db, task, plan), true);
    assert.equal(acknowledgeReviewFile(db, task, plan), false);
    assert.deepEqual(
      Object.keys(
        JSON.parse(
          db.prepare("SELECT plan FROM review_jobs WHERE task=?").get(task).plan,
        ),
      ).sort(),
      ["file", "fingerprint", "tree"],
    );
    db.close();

    db = new DatabaseSync(path);
    initializeTaskDatabase(db, root);
    assert.deepEqual(
      acknowledgedReviewFiles(db, task, plan.tree, [plan.file, "other.ts"]),
      [plan.file],
    );
    assert.deepEqual(acknowledgedReviewFiles(db, task, "c".repeat(40), [plan.file]), []);
    assert.throws(
      () => acknowledgeReviewFile(db, task, { ...plan, fingerprint: "bad" }),
      /Invalid/,
    );
    db.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
