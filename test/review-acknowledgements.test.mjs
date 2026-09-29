import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initializeTaskDatabase } from "../src/task-database.ts";
import {
  acknowledgeReviewFile,
  acknowledgeReviewPage,
  acknowledgedReviewFiles,
  acknowledgedReviewPages,
  paginatedReviewProgress,
  reviewCoverage,
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

test("exact page acknowledgements persist as bounded review progress", () => {
  const root = mkdtempSync(join(tmpdir(), "review-page-ack-")),
    path = join(root, "tasks.sqlite"),
    task = "22222222-2222-4222-8222-222222222222",
    common = {
      tree: "c".repeat(40),
      file: "large.txt",
      pages: 3,
      fileFingerprint: "d".repeat(64),
    },
    small = {
      tree: common.tree,
      file: "small.txt",
      fingerprint: "a".repeat(64),
    };
  try {
    const db = new DatabaseSync(path);
    initializeTaskDatabase(db, root);
    for (const page of [0, 2])
      assert.equal(
        acknowledgeReviewPage(db, task, {
          ...common,
          page,
          pageFingerprint: String(page + 1).repeat(64),
        }),
        true,
      );
    assert.deepEqual(acknowledgedReviewPages(db, task, common), [0, 2]);
    assert.deepEqual(paginatedReviewProgress(db, task, common.tree, [common.file]), {
      "large.txt": { pages: 3, acknowledged: [0, 2] },
    });
    assert.deepEqual(reviewCoverage(db, task, common.tree, [common.file]), {
      completed: [],
      complete: false,
    });
    acknowledgeReviewFile(db, task, small);
    acknowledgeReviewPage(db, task, {
      ...common,
      page: 1,
      pageFingerprint: "4".repeat(64),
    });
    assert.deepEqual(reviewCoverage(db, task, common.tree, [common.file]), {
      completed: [common.file],
      complete: true,
    });
    assert.deepEqual(reviewCoverage(db, task, common.tree, [small.file, common.file]), {
      completed: [small.file, common.file],
      complete: true,
    });
    assert.deepEqual(
      paginatedReviewProgress(db, task, "e".repeat(40), [common.file]),
      {},
    );
    assert.throws(
      () =>
        acknowledgeReviewPage(db, task, {
          ...common,
          page: 0,
          pageFingerprint: "f".repeat(64),
        }),
      /inconsistent/,
    );
    db.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
