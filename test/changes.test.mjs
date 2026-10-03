import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { runner } from "../src/runner.ts";
import { git, snapshot } from "../src/changes.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function finished(app, id) {
  for (let i = 0; i < 200; i++) {
    const row = app.request({ op: "show", id }).task;
    if (["succeeded", "failed"].includes(row.status)) return row;
    await sleep(10);
  }
  throw Error("Timeout");
}
async function checked(app, id) {
  for (let i = 0; i < 200; i++) {
    const t = app.request({ op: "show", id }).task;
    const checks = JSON.parse(t.checks ?? "{}");
    if (checks.status && checks.status !== "running") return checks;
    await sleep(10);
  }
  throw Error("Timeout");
}
function setup() {
  const root = mkdtempSync(join(tmpdir(), "changes-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-b", "main"]);
  writeFileSync(join(repo, "README.md"), "before\n");
  writeFileSync(join(repo, "package-lock.json"), "{}");
  git(repo, ["add", "."]);
  git(repo, [
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "fixture",
  ]);
  return { root, repo };
}
test("edit snapshot includes new files; checks and commit approval are bound to exact content", async () => {
  const f = setup();
  let pass = true;
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      [
        "-e",
        "require('fs').writeFileSync('README.md','edited\\n');require('fs').writeFileSync('new.txt','new\\n')",
      ],
    ],
    isolate: (_tree, _state, command, args, adapter) => ({
      command: adapter ? command : process.execPath,
      args: adapter
        ? args
        : ["-e", pass ? 'console.log("checks passed")' : "process.exit(1)"],
      cleanup() {},
    }),
  });
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    assert.equal(task.status, "waiting_for_approval");
    assert.throws(() => app.request({ op: "review", id: task.id }), /finished/);
    app.request({ op: "approve", id: task.id });
    const done = await finished(app, task.id);
    assert.equal(done.review, "pending");
    assert.equal(readFileSync(join(f.repo, "README.md"), "utf8"), "before\n");
    let review = app.request({ op: "review", id: task.id });
    assert.ok(review.files.includes("new.txt"));
    assert.throws(
      () =>
        app.request({
          op: "commit",
          id: task.id,
          tree: review.tree,
          message: "Approved",
        }),
      /Checks must pass/,
    );
    assert.throws(
      () =>
        app.request({
          op: "create",
          adapter: "codex",
          prompt: "continue",
          conversation: task.conversation,
        }),
      /Commit or discard/,
    );
    app.request({ op: "project-checks", id: "default", dependencies: f.repo });
    pass = false;
    app.request({ op: "validate", id: task.id, tree: review.tree });
    assert.equal((await checked(app, task.id)).status, "failed");
    assert.throws(
      () =>
        app.request({
          op: "commit",
          id: task.id,
          tree: review.tree,
          message: "Approved",
        }),
      /Checks must pass/,
    );
    pass = true;
    app.request({ op: "validate", id: task.id, tree: review.tree });
    assert.equal((await checked(app, task.id)).status, "passed");
    writeFileSync(join(done.worktree, "new.txt"), "changed after review");
    assert.throws(
      () =>
        app.request({
          op: "commit",
          id: task.id,
          tree: review.tree,
          message: "Approved",
        }),
      /changed/,
    );
    review = app.request({ op: "review", id: task.id });
    assert.throws(
      () =>
        app.request({
          op: "commit",
          id: task.id,
          tree: review.tree,
          message: "Approved",
        }),
      /Checks must pass/,
    );
    app.request({ op: "validate", id: task.id, tree: review.tree });
    await checked(app, task.id);
    const committed = app.request({
      op: "commit",
      id: task.id,
      tree: review.tree,
      message: "Approved edits",
    });
    assert.equal(committed.review, "committed");
    assert.equal(
      git(f.repo, ["show", committed.commit_sha + ":new.txt"]),
      "changed after review",
    );
    assert.equal(git(f.repo, ["branch", "--show-current"]), "main");
    assert.equal(readFileSync(join(f.repo, "README.md"), "utf8"), "before\n");
    const next = app.request({
      op: "create",
      adapter: "codex",
      prompt: "continue",
      conversation: task.conversation,
    });
    assert.equal(next.revision, committed.commit_sha);
    assert.throws(
      () =>
        app.request({ op: "commit", id: task.id, tree: review.tree, message: "Again" }),
      /resolved/,
    );
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
test("attachment input is excluded from snapshots and sensitive filenames are flagged", () => {
  const f = setup();
  const state = join(f.root, "state");
  mkdirSync(state);
  try {
    mkdirSync(join(f.repo, ".agentd-input"));
    writeFileSync(join(f.repo, ".agentd-input", "photo.png"), "private");
    writeFileSync(join(f.repo, ".env"), "SECRET=value");
    const value = snapshot(f.repo, git(f.repo, ["rev-parse", "HEAD"]), state);
    assert.deepEqual(value.files, [".env"]);
    assert.deepEqual(value.blocked, [".env"]);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("revision requests preserve an exact uncommitted snapshot across restart and require fresh run/check/commit approval", async () => {
  const f = setup(),
    config = {
      repo: f.repo,
      stateDir: join(f.root, "state"),
      worktrees: join(f.root, "trees"),
      logs: join(f.root, "logs"),
      editing: true,
      editAdapters: ["claude"],
      command: (_a, p) => [
        process.execPath,
        [
          "-e",
          p.includes("refine")
            ? "const fs=require('fs');if(fs.readFileSync('new.txt','utf8')!=='saved')process.exit(4);fs.appendFileSync('README.md','refined\\n')"
            : "const fs=require('fs');fs.writeFileSync('new.txt','saved');fs.writeFileSync('README.md','first\\n')",
        ],
      ],
      isolate: (_t, _s, command, args, adapter) => ({
        command: adapter ? command : process.execPath,
        args: adapter ? args : ["-e", ""],
        cleanup() {},
      }),
    };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const first = app.request({
      op: "create",
      adapter: "claude",
      mode: "edit",
      prompt: "first",
    });
    app.request({ op: "approve", id: first.id });
    const original = await finished(app, first.id),
      view = app.request({ op: "review", id: first.id });
    assert.throws(
      () => app.request({ op: "revise", id: first.id, tree: "stale", prompt: "refine" }),
      /changed/,
    );
    const next = app.request({
      op: "revise",
      id: first.id,
      tree: view.tree,
      prompt: "refine",
    });
    assert.equal(next.status, "waiting_for_approval");
    assert.equal(next.checks, null);
    assert.equal(next.revision, first.revision);
    assert.equal(next.worktree, null);
    assert.equal(app.request({ op: "show", id: first.id }).task.review, "superseded");
    assert.equal(
      app.request({ op: "revise", id: first.id, tree: view.tree, prompt: "refine" }).id,
      next.id,
    );
    assert.throws(
      () =>
        app.request({ op: "revise", id: first.id, tree: view.tree, prompt: "different" }),
      /different revision/,
    );
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    writeFileSync(join(original.worktree, "new.txt"), "later change");
    app.request({ op: "approve", id: next.id });
    const revised = await finished(app, next.id);
    assert.equal(revised.status, "succeeded");
    assert.notEqual(revised.worktree, original.worktree);
    assert.equal(readFileSync(join(revised.worktree, "new.txt"), "utf8"), "saved");
    assert.equal(readFileSync(join(original.worktree, "README.md"), "utf8"), "first\n");
    const review = app.request({ op: "review", id: next.id });
    assert.match(review.patch, /refined/);
    assert.ok(review.files.includes("new.txt"));
    assert.throws(
      () =>
        app.request({ op: "commit", id: next.id, tree: review.tree, message: "Refined" }),
      /Checks must pass/,
    );
    app.request({ op: "project-checks", id: "default", dependencies: f.repo });
    app.request({ op: "validate", id: next.id, tree: review.tree });
    await checked(app, next.id);
    const commit = app.request({
      op: "commit",
      id: next.id,
      tree: review.tree,
      message: "Refined",
    });
    assert.equal(git(f.repo, ["rev-parse", commit.commit_sha + "^"]), first.revision);
    assert.equal(git(f.repo, ["show", commit.commit_sha + ":new.txt"]), "saved");
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("cancelling an unstarted revision and retrying retains its snapshot", async () => {
  const f = setup(),
    app = runner({
      repo: f.repo,
      stateDir: join(f.root, "state"),
      worktrees: join(f.root, "trees"),
      logs: join(f.root, "logs"),
      editing: true,
      editAdapters: ["claude"],
      command: () => [
        process.execPath,
        ["-e", "require('fs').appendFileSync('README.md','next')"],
      ],
      isolate: (_t, _s, command, args) => ({ command, args, cleanup() {} }),
    });
  await once(app.server, "listening");
  try {
    const first = app.request({
      op: "create",
      adapter: "claude",
      mode: "edit",
      prompt: "edit",
    });
    app.request({ op: "approve", id: first.id });
    await finished(app, first.id);
    const view = app.request({ op: "review", id: first.id }),
      next = app.request({
        op: "revise",
        id: first.id,
        tree: view.tree,
        prompt: "again",
      });
    app.request({ op: "cancel", id: next.id });
    const retry = app.request({ op: "retry", id: next.id });
    assert.equal(retry.seed_tree, view.tree);
    app.request({ op: "approve", id: retry.id });
    const done = await finished(app, retry.id);
    assert.equal(
      readFileSync(join(done.worktree, "README.md"), "utf8"),
      "before\nnextnext",
    );
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("background review keeps reads responsive, excludes mutations and recovers active retries", async () => {
  const f = setup();
  let release, entered;
  const started = new Promise((r) => {
    entered = r;
  });
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','edited\\n')"],
    ],
    isolate: (_tree, _state, command, args) => ({ command, args, cleanup() {} }),
    reviewPrepare: async (input) => {
      entered();
      await new Promise((r) => {
        release = r;
      });
      return {
        ...snapshot(input.worktree, input.revision, input.stateDir),
        conflicts: [],
      };
    },
  });
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    await finished(app, task.id);
    const job = app.request({ op: "review-start", id: task.id, owner: "a" });
    await started;
    assert.equal(app.request({ op: "review-start", id: task.id, owner: "a" }).id, job.id);
    assert.equal(app.request({ op: "show", id: task.id }).task.status, "succeeded");
    for (const op of [
      "discard",
      "validate",
      "commit",
      "revise",
      "project-register",
      "storage-cleanup",
    ])
      assert.throws(() => app.request({ op, id: task.id }), /preview/);
    assert.throws(
      () => app.request({ op: "review-job", owner: "b", job: job.id }),
      /expired/,
    );
    release();
    let result;
    for (let i = 0; i < 100; i++) {
      result = app.request({ op: "review-job", owner: "a", job: job.id });
      if (result.status !== "preparing") break;
      await sleep(10);
    }
    assert.equal(result.status, "succeeded");
    assert.match(result.result.patch, /edited/);
    assert.equal(result.result.tree, app.request({ op: "review", id: task.id }).tree);
    writeFileSync(
      join(app.request({ op: "show", id: task.id }).task.worktree, "README.md"),
      "new edit\n",
    );
    assert.throws(
      () => app.request({ op: "validate", id: task.id, tree: result.result.tree }),
      /changed/,
    );
  } finally {
    release?.();
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("large-review file reads stay owner-bound and pinned to the prepared tree", async () => {
  const f = setup();
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','large preview fixture\\n')"],
    ],
    isolate: (_tree, _state, command, args) => ({ command, args, cleanup() {} }),
    reviewPrepare: async (input) => ({
      ...snapshot(input.worktree, input.revision, input.stateDir),
      patch: "",
      truncated: true,
      conflicts: [],
    }),
  });
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    await finished(app, task.id);
    const started = app.request({ op: "review-start", id: task.id, owner: "a" });
    let job;
    for (let i = 0; i < 100; i++) {
      job = app.request({ op: "review-job", owner: "a", job: started.id });
      if (job.status !== "preparing") break;
      await sleep(10);
    }
    assert.equal(job.status, "succeeded");
    assert.throws(
      () =>
        app.request({
          op: "review-file",
          owner: "b",
          job: job.id,
          tree: job.result.tree,
          file: "README.md",
        }),
      /expired/,
    );
    assert.throws(
      () =>
        app.request({
          op: "review-file",
          owner: "a",
          job: job.id,
          tree: "0".repeat(40),
          file: "README.md",
        }),
      /stale/,
    );
    const page = app.request({
      op: "review-file",
      owner: "a",
      job: job.id,
      tree: job.result.tree,
      file: "README.md",
    });
    assert.equal(page.tree, job.result.tree);
    assert.match(page.patch, /large preview fixture/);
    assert.equal(page.acknowledged, false);
    assert.throws(
      () =>
        app.request({
          op: "review-file-acknowledge",
          owner: "a",
          job: job.id,
          tree: job.result.tree,
          file: "README.md",
          fingerprint: "0".repeat(64),
        }),
      /changed/,
    );
    const saved = app.request({
      op: "review-file-acknowledge",
      owner: "a",
      job: job.id,
      tree: job.result.tree,
      file: "README.md",
      fingerprint: page.fingerprint,
    });
    assert.equal(saved.acknowledged, true);
    assert.equal(saved.complete, true);
    assert.deepEqual(saved.acknowledgedFiles, ["README.md"]);
    let blocked = app.request({
      op: "commit-start",
      owner: "a",
      id: task.id,
      tree: job.result.tree,
      message: "Still blocked",
    });
    for (let i = 0; i < 100; i++) {
      blocked = app.request({ op: "commit-job", owner: "a", job: blocked.id });
      if (blocked.status !== "preparing") break;
      await sleep(10);
    }
    assert.equal(blocked.status, "failed");
    assert.match(blocked.error, /Checks must pass/);
    assert.equal(
      app.request({
        op: "review-file",
        owner: "a",
        job: job.id,
        tree: job.result.tree,
        file: "README.md",
      }).acknowledged,
      true,
    );
    const audit = app.request({ op: "audit" });
    assert.equal(
      audit.find((item) => item.action === "acknowledge-review-file").task,
      task.id,
    );
    const again = app.request({ op: "review-start", id: task.id, owner: "a" });
    for (let i = 0; i < 100; i++) {
      job = app.request({ op: "review-job", owner: "a", job: again.id });
      if (job.status !== "preparing") break;
      await sleep(10);
    }
    assert.deepEqual(job.result.acknowledgedFiles, ["README.md"]);
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("one oversized file requires durable acknowledgement of every bounded page", async () => {
  const f = setup();
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','after\\n'.repeat(30000))"],
    ],
    isolate: (_tree, _state, command, args, adapter) => ({
      command: adapter ? command : process.execPath,
      args: adapter ? args : ["-e", "console.log('checks passed')"],
      cleanup() {},
    }),
  });
  await once(app.server, "listening");
  const poll = async (op, job) => {
    let value;
    for (let i = 0; i < 500; i++) {
      value = app.request({ op, owner: "a", job });
      if (value.status !== "preparing") return value;
      await sleep(20);
    }
    return value;
  };
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "large edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    await finished(app, task.id);
    const started = app.request({ op: "review-start", id: task.id, owner: "a" });
    const job = await poll("review-job", started.id);
    assert.equal(job.status, "succeeded");
    assert.equal(job.result.truncated, true);
    assert.throws(
      () => app.request({ op: "validate", id: task.id, tree: job.result.tree }),
      /Complete the exact file review/,
    );
    assert.throws(
      () =>
        app.request({
          op: "commit",
          id: task.id,
          tree: job.result.tree,
          message: "Not reviewed",
        }),
      /Complete the exact file review/,
    );
    const first = app.request({
      op: "review-file",
      owner: "a",
      job: job.id,
      tree: job.result.tree,
      file: "README.md",
    });
    assert.equal(first.paginated, true);
    assert.ok(first.pages > 1);
    for (let page = 0; page < first.pages; page++) {
      const value =
        page === 0
          ? first
          : app.request({
              op: "review-file-page",
              owner: "a",
              job: job.id,
              tree: job.result.tree,
              file: "README.md",
              page,
            });
      const saved = app.request({
        op: "review-file-page-acknowledge",
        owner: "a",
        job: job.id,
        tree: job.result.tree,
        file: "README.md",
        page,
        pages: value.pages,
        fileFingerprint: value.fileFingerprint,
        pageFingerprint: value.pageFingerprint,
      });
      assert.deepEqual(
        saved.acknowledgedPages,
        Array.from({ length: page + 1 }, (_, i) => i),
      );
      assert.equal(saved.complete, page === first.pages - 1);
    }
    const again = app.request({ op: "review-start", id: task.id, owner: "a" });
    const persisted = await poll("review-job", again.id);
    assert.deepEqual(persisted.result.paginatedFiles["README.md"], {
      pages: first.pages,
      acknowledged: Array.from({ length: first.pages }, (_, i) => i),
    });
    assert.equal(persisted.result.largeReviewComplete, true);
    app.request({ op: "project-checks", id: "default", dependencies: f.repo });
    const validation = app.request({
      op: "validation-start",
      owner: "a",
      id: task.id,
      tree: job.result.tree,
    });
    assert.equal((await poll("validation-job", validation.id)).status, "succeeded");
    assert.equal((await checked(app, task.id)).status, "passed");
    const commit = app.request({
      op: "commit-start",
      owner: "a",
      id: task.id,
      tree: job.result.tree,
      message: "Still blocked",
    });
    const committed = await poll("commit-job", commit.id);
    assert.equal(committed.status, "succeeded");
    assert.equal(committed.result.review, "committed");
    assert.equal(
      app
        .request({ op: "audit" })
        .filter((entry) => entry.action === "acknowledge-review-page").length,
      first.pages,
    );
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("background check preparation is owner-bound, cancellable and revalidates exact changes", async () => {
  const f = setup();
  let release,
    entered,
    waiting = true;
  const started = () =>
    new Promise((resolve) => {
      entered = resolve;
    });
  let prepared = started();
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','edited\\n')"],
    ],
    isolate: (_tree, _state, command, args, adapter) => ({
      command: adapter ? command : process.execPath,
      args: adapter ? args : ["-e", "console.log('checks passed')"],
      cleanup() {},
    }),
    reviewPrepare: async (input, signal) => {
      entered();
      if (waiting) await new Promise((resolve) => (release = resolve));
      if (signal.aborted) throw Error("Review preparation stopped.");
      return {
        ...snapshot(input.worktree, input.revision, input.stateDir),
        conflicts: [],
      };
    },
  });
  const waitJob = async (owner, id) => {
    for (let i = 0; i < 200; i++) {
      const job = app.request({ op: "validation-job", owner, job: id });
      if (job.status !== "preparing") return job;
      await sleep(10);
    }
    throw Error("Validation job timeout");
  };
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    const done = await finished(app, task.id);
    app.request({ op: "project-checks", id: "default", dependencies: f.repo });
    let view = app.request({ op: "review", id: task.id });

    const cancelled = app.request({
      op: "validation-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
    });
    await prepared;
    assert.equal(
      app.request({
        op: "validation-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
      }).id,
      cancelled.id,
    );
    assert.equal(app.request({ op: "show", id: task.id }).task.status, "succeeded");
    assert.throws(
      () => app.request({ op: "validation-job", owner: "b", job: cancelled.id }),
      /expired/,
    );
    app.request({ op: "validation-cancel", owner: "a", job: cancelled.id });
    release();
    assert.equal((await waitJob("a", cancelled.id)).status, "cancelled");
    assert.equal(app.request({ op: "show", id: task.id }).task.checks, null);

    prepared = started();
    const stale = app.request({
      op: "validation-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
    });
    await prepared;
    for (const op of ["discard", "commit", "revise", "project-register"])
      assert.throws(() => app.request({ op, id: task.id }), /preview/);
    writeFileSync(join(done.worktree, "README.md"), "changed during preparation\n");
    release();
    const failed = await waitJob("a", stale.id);
    assert.equal(failed.status, "failed");
    assert.match(failed.error, /changed/i);
    assert.equal(app.request({ op: "show", id: task.id }).task.checks, null);

    view = app.request({ op: "review", id: task.id });
    waiting = false;
    const accepted = app.request({
      op: "validation-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
    });
    assert.equal((await waitJob("a", accepted.id)).status, "succeeded");
    assert.equal((await checked(app, task.id)).status, "passed");
  } finally {
    release?.();
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("background commit preparation preserves approval, exact content and owner cancellation", async () => {
  const f = setup();
  let release,
    entered,
    waiting = true;
  const started = () =>
    new Promise((resolve) => {
      entered = resolve;
    });
  let prepared = started();
  const config = {
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','edited\\n')"],
    ],
    isolate: (_tree, _state, command, args, adapter) => ({
      command: adapter ? command : process.execPath,
      args: adapter ? args : ["-e", "console.log('checks passed')"],
      cleanup() {},
    }),
    reviewPrepare: async (input, signal) => {
      entered();
      if (waiting) await new Promise((resolve) => (release = resolve));
      if (signal.aborted) throw Error("Commit preparation stopped.");
      return {
        ...snapshot(input.worktree, input.revision, input.stateDir),
        conflicts: [],
      };
    },
  };
  let app = runner(config);
  const waitJob = async (owner, id) => {
    for (let i = 0; i < 200; i++) {
      const job = app.request({ op: "commit-job", owner, job: id });
      if (job.status !== "preparing") return job;
      await sleep(10);
    }
    throw Error("Commit job timeout");
  };
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    const done = await finished(app, task.id);
    app.request({ op: "project-checks", id: "default", dependencies: f.repo });
    let view = app.request({ op: "review", id: task.id });
    app.request({ op: "validate", id: task.id, tree: view.tree });
    assert.equal((await checked(app, task.id)).status, "passed");

    const cancelled = app.request({
      op: "commit-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      message: "Approved edit",
    });
    await prepared;
    assert.equal(
      app.request({
        op: "commit-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        message: "Approved edit",
      }).id,
      cancelled.id,
    );
    assert.throws(
      () => app.request({ op: "commit-job", owner: "b", job: cancelled.id }),
      /expired/,
    );
    assert.throws(
      () =>
        app.request({
          op: "commit-start",
          owner: "a",
          id: task.id,
          tree: view.tree,
          message: "Different approval",
        }),
      /progress/,
    );
    app.request({ op: "commit-cancel", owner: "a", job: cancelled.id });
    release();
    assert.equal((await waitJob("a", cancelled.id)).status, "cancelled");
    assert.equal(app.request({ op: "show", id: task.id }).task.review, "pending");

    prepared = started();
    const stale = app.request({
      op: "commit-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      message: "Approved edit",
    });
    await prepared;
    assert.equal(app.request({ op: "show", id: task.id }).task.status, "succeeded");
    for (const op of ["discard", "validate", "revise", "project-register"])
      assert.throws(() => app.request({ op, id: task.id }), /preview/);
    writeFileSync(join(done.worktree, "README.md"), "changed during commit\n");
    release();
    const failed = await waitJob("a", stale.id);
    assert.equal(failed.status, "failed");
    assert.match(failed.error, /changed/i);
    assert.equal(app.request({ op: "show", id: task.id }).task.review, "pending");

    view = app.request({ op: "review", id: task.id });
    app.request({ op: "validate", id: task.id, tree: view.tree });
    assert.equal((await checked(app, task.id)).status, "passed");
    waiting = false;
    const accepted = app.request({
      op: "commit-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      message: "Approved edit",
    });
    const committed = await waitJob("a", accepted.id);
    assert.equal(committed.status, "succeeded");
    assert.equal(committed.result.review, "committed");
    assert.equal(
      git(f.repo, ["show", committed.result.commit_sha + ":README.md"]),
      "changed during commit",
    );
    assert.equal(
      app.request({
        op: "commit-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        message: "Approved edit",
      }).result.commit_sha,
      committed.result.commit_sha,
    );
    assert.throws(
      () =>
        app.request({
          op: "commit-start",
          owner: "a",
          id: task.id,
          tree: view.tree,
          message: "Different approval",
        }),
      /resolved/,
    );
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(
      app.request({
        op: "commit-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        message: "Approved edit",
      }).result.commit_sha,
      committed.result.commit_sha,
    );
  } finally {
    release?.();
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("background revision preparation preserves exact edits and recovers after restart", async () => {
  const f = setup();
  let release,
    entered,
    waiting = true;
  const started = () =>
    new Promise((resolve) => {
      entered = resolve;
    });
  let prepared = started();
  const config = {
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["codex"],
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','edited\\n')"],
    ],
    isolate: (_tree, _state, command, args) => ({ command, args, cleanup() {} }),
    reviewPrepare: async (input, signal) => {
      entered();
      if (waiting) await new Promise((resolve) => (release = resolve));
      if (signal.aborted) throw Error("Revision preparation stopped.");
      return {
        ...snapshot(input.worktree, input.revision, input.stateDir),
        conflicts: [],
      };
    },
  };
  let app = runner(config);
  const waitJob = async (owner, id) => {
    for (let i = 0; i < 200; i++) {
      const job = app.request({ op: "revision-job", owner, job: id });
      if (job.status !== "preparing") return job;
      await sleep(10);
    }
    throw Error("Revision job timeout");
  };
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "codex",
      prompt: "edit",
      mode: "edit",
    });
    app.request({ op: "approve", id: task.id });
    const done = await finished(app, task.id);
    let view = app.request({ op: "review", id: task.id });

    const cancelled = app.request({
      op: "revision-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      prompt: "Refine it",
    });
    await prepared;
    assert.equal(
      app.request({
        op: "revision-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        prompt: "Refine it",
      }).id,
      cancelled.id,
    );
    assert.throws(
      () => app.request({ op: "revision-job", owner: "b", job: cancelled.id }),
      /expired/,
    );
    app.request({ op: "revision-cancel", owner: "a", job: cancelled.id });
    release();
    assert.equal((await waitJob("a", cancelled.id)).status, "cancelled");
    assert.equal(app.request({ op: "show", id: task.id }).task.review, "pending");

    prepared = started();
    const stale = app.request({
      op: "revision-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      prompt: "Refine it",
    });
    await prepared;
    for (const op of ["discard", "validate", "commit", "project-register"])
      assert.throws(() => app.request({ op, id: task.id }), /preview/);
    writeFileSync(join(done.worktree, "README.md"), "changed during revision\n");
    release();
    const failed = await waitJob("a", stale.id);
    assert.equal(failed.status, "failed");
    assert.match(failed.error, /changed/i);
    assert.equal(app.request({ op: "show", id: task.id }).task.review, "pending");

    view = app.request({ op: "review", id: task.id });
    waiting = false;
    const accepted = app.request({
      op: "revision-start",
      owner: "a",
      id: task.id,
      tree: view.tree,
      prompt: "Refine it",
    });
    const revised = await waitJob("a", accepted.id);
    assert.equal(revised.status, "succeeded");
    assert.equal(revised.result.seed_tree, view.tree);
    assert.equal(revised.result.status, "waiting_for_approval");
    assert.equal(app.request({ op: "show", id: task.id }).task.review, "superseded");
    assert.equal(
      app.request({
        op: "revision-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        prompt: "Refine it",
      }).result.id,
      revised.result.id,
    );
    assert.throws(
      () =>
        app.request({
          op: "revision-start",
          owner: "a",
          id: task.id,
          tree: view.tree,
          prompt: "Different request",
        }),
      /different revision/,
    );
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(
      app.request({
        op: "revision-start",
        owner: "a",
        id: task.id,
        tree: view.tree,
        prompt: "Refine it",
      }).result.id,
      revised.result.id,
    );
  } finally {
    release?.();
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
