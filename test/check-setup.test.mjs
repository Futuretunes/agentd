import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { runner } from "../src/runner.ts";
import { git } from "../src/changes.ts";
import { checkManifest } from "../src/check-setup.ts";
import { destination } from "../src/egress-proxy.ts";
import { execFile } from "node:child_process";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "check-setup-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  writeFileSync(
    join(repo, "package.json"),
    JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      scripts: { test: "node --test" },
    }),
  );
  writeFileSync(
    join(repo, "package-lock.json"),
    JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "fixture", version: "1.0.0" } },
    }),
  );
  git(repo, ["init", "-b", "main"]);
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
async function done(app) {
  for (let i = 0; i < 200; i++) {
    const v = app.request({ op: "check-setup", project: "default" });
    if (!v.busy) return v;
    await sleep(10);
  }
  throw Error("Timeout");
}
test("setup validates public lockfile integrity and script preview, rejecting links and unsupported sources", () => {
  const f = fixture();
  try {
    const valid = checkManifest(f.repo);
    assert.deepEqual(valid.scripts, { test: "node --test" });
    assert.equal(valid.count, 0);
    const lock = JSON.parse(readFileSync(join(f.repo, "package-lock.json")));
    for (const resolved of [
      "file:../secret",
      "git+https://github.com/a/b",
      "https://localhost/a",
      "https://registry.npmjs.org/a?token=secret",
      "https://user:secret@registry.npmjs.org/a",
    ]) {
      lock.packages["node_modules/x"] = { resolved, integrity: "sha512-YWJj" };
      writeFileSync(join(f.repo, "package-lock.json"), JSON.stringify(lock));
      assert.throws(() => checkManifest(f.repo));
    }
    rmSync(join(f.repo, "package.json"));
    symlinkSync("/etc/passwd", join(f.repo, "package.json"));
    assert.throws(() => checkManifest(f.repo), /regular/);
    assert.equal(
      destination("CONNECT registry.npmjs.org:443 HTTP/1.1\r\n", "npm"),
      "registry.npmjs.org",
    );
    for (const host of ["github.com", "api.anthropic.com", "127.0.0.1"])
      assert.throws(() => destination("CONNECT " + host + ":443 HTTP/1.1\r\n", "npm"));
    assert.throws(() =>
      destination("CONNECT registry.npmjs.org:443 HTTP/1.1\r\n", "claude"),
    );
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
test("approved preparation pins manifests, excludes worker approval, preserves prior setup on failure and survives restart", async () => {
  const f = fixture();
  let finish;
  const config = {
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    command: () => [process.execPath, ["-e", ""]],
    accountStatus: () => ({ state: "signed_out" }),
    prepareDependencies: async (stage, state, signal) => {
      mkdirSync(join(stage, "node_modules"));
      await new Promise((resolve, reject) => {
        finish = resolve;
        signal.addEventListener("abort", () => reject(Error("cancelled")), {
          once: true,
        });
      });
    },
  };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const output = await new Promise((resolve, reject) =>
      execFile(
        process.execPath,
        [
          new URL("../src/control.ts", import.meta.url).pathname,
          "check-setup",
          "default",
        ],
        {
          env: {
            ...process.env,
            AGENTD_CONTROL_SOCKET: join(config.stateDir, "control.sock"),
          },
        },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      ),
    );
    const initial = JSON.parse(output);
    assert.equal(initial.project, "default");
    assert.equal(initial.busy, false);
    const plan = initial.plan;
    assert.equal(plan.ready, false);
    assert.throws(
      () =>
        app.request({ op: "check-prepare", project: "default", fingerprint: "stale" }),
      /changed/,
    );
    const task = app.request({ op: "create", adapter: "claude", prompt: "test" });
    app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    await sleep(0);
    assert.throws(() => app.request({ op: "approve", id: task.id }), /preparation/);
    assert.throws(
      () =>
        app.request({
          op: "check-prepare",
          project: "default",
          fingerprint: plan.fingerprint,
        }),
      /Wait/,
    );
    finish();
    assert.equal((await done(app)).plan.ready, true);
    const before = app.request({ op: "projects" })[0].check_dependencies;
    let job = app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    await sleep(0);
    app.request({ op: "check-cancel", id: job.id });
    assert.equal((await done(app)).jobs[0].state, "cancelled");
    assert.equal(app.request({ op: "projects" })[0].check_dependencies, before);
    assert.equal(existsSync(join(config.stateDir, "dependencies", job.id)), false);
    job = app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    await sleep(0);
    const pkg = JSON.parse(readFileSync(join(f.repo, "package.json")));
    pkg.scripts.test = "node --test test";
    writeFileSync(join(f.repo, "package.json"), JSON.stringify(pkg));
    finish();
    assert.equal((await done(app)).jobs[0].state, "failed");
    assert.equal(app.request({ op: "projects" })[0].check_dependencies, before);
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(
      app.request({ op: "check-setup", project: "default" }).plan.ready,
      false,
    );
    assert.equal(app.request({ op: "projects" })[0].check_dependencies, before);
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
test(
  "dependency sandbox hides host data, protects application code and has no direct network",
  { skip: process.platform !== "linux" || process.env.AGENTD_TEST_ISOLATION !== "1" },
  async () => {
    const { dependencySandbox } = await import("../src/check-setup.ts");
    const { spawn } = await import("node:child_process");
    const f = fixture(),
      stage = join(f.root, "stage");
    mkdirSync(stage);
    writeFileSync(join(f.root, "private"), "secret");
    const sandbox = dependencySandbox(stage, f.root);
    try {
      const separator = sandbox.args.indexOf("--"),
        script = `const fs=require('fs');if(fs.existsSync(${JSON.stringify(join(f.root, "private"))}))process.exit(2);fs.writeFileSync('/workspace/result','ok');try{fs.writeFileSync(${JSON.stringify(new URL("../src/check-worker.ts", import.meta.url).pathname)},'bad');process.exit(3)}catch{}const s=require('net').connect(443,'1.1.1.1');s.on('connect',()=>process.exit(4));s.on('error',()=>process.exit(0));setTimeout(()=>process.exit(5),3000);`;
      await new Promise((resolve, reject) => {
        const child = spawn(
          sandbox.command,
          [...sandbox.args.slice(0, separator + 1), process.execPath, "-e", script],
          { env: { PATH: "/usr/local/bin:/usr/bin:/bin" }, stdio: "ignore" },
        );
        child.on("error", reject);
        child.on("close", (code) =>
          code === 0 ? resolve() : reject(Error("Boundary failure " + code)),
        );
      });
      assert.equal(readFileSync(join(stage, "result"), "utf8"), "ok");
    } finally {
      sandbox.cleanup();
      rmSync(f.root, { recursive: true, force: true });
    }
  },
);
test("review setup uses the edited manifests and enables exact-content checks and an approved commit", async () => {
  const f = fixture(),
    config = {
      repo: f.repo,
      stateDir: join(f.root, "state"),
      worktrees: join(f.root, "trees"),
      logs: join(f.root, "logs"),
      editing: true,
      editAdapters: ["claude"],
      accountStatus: () => ({ state: "signed_out" }),
      command: () => [
        process.execPath,
        ["-e", "require('fs').writeFileSync('change.txt','reviewed edit')"],
      ],
      prepareDependencies: async (stage) => {
        mkdirSync(join(stage, "node_modules"));
      },
      isolate: (_tree, _state, command, args, adapter) => ({
        command: adapter ? command : process.execPath,
        args: adapter ? args : ["-e", 'console.log("fixture checks passed")'],
        cleanup() {},
      }),
    };
  const app = runner(config);
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      project: "default",
      adapter: "claude",
      mode: "edit",
      prompt: "edit",
    });
    app.request({ op: "approve", id: task.id });
    for (
      let i = 0;
      i < 200 && app.request({ op: "show", id: task.id }).task.status !== "succeeded";
      i++
    )
      await sleep(10);
    const review = app.request({ op: "review", id: task.id });
    assert.equal(review.project, "default");
    assert.throws(
      () => app.request({ op: "validate", id: task.id, tree: review.tree }),
      /Set up checks/,
    );
    const setup = app.request({ op: "check-setup", project: "default", task: task.id });
    app.request({
      op: "check-prepare",
      project: "default",
      task: task.id,
      fingerprint: setup.plan.fingerprint,
    });
    await done(app);
    app.request({ op: "validate", id: task.id, tree: review.tree });
    for (let i = 0; i < 200; i++) {
      if (
        JSON.parse(app.request({ op: "show", id: task.id }).task.checks).status !==
        "running"
      )
        break;
      await sleep(10);
    }
    const result = app.request({
      op: "commit",
      id: task.id,
      tree: review.tree,
      message: "Approved",
    });
    assert.equal(result.review, "committed");
    assert.equal(
      git(f.repo, ["show", result.commit_sha + ":change.txt"]),
      "reviewed edit",
    );
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("cancelling dependency setup before dispatch records cancellation without starting preparation", async () => {
  const f = fixture();
  let calls = 0;
  const config = {
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: join(f.root, "trees"),
    logs: join(f.root, "logs"),
    command: () => [process.execPath, ["-e", ""]],
    accountStatus: async () => ({ state: "signed_out" }),
    prepareDependencies: async () => {
      calls++;
    },
  };
  const app = runner(config);
  await once(app.server, "listening");
  try {
    const plan = app.request({ op: "check-setup", project: "default" }).plan;
    const job = app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    app.request({ op: "check-cancel", id: job.id });
    assert.equal(app.request({ op: "check-setup", project: "default" }).busy, true);
    assert.throws(
      () =>
        app.request({
          op: "check-prepare",
          project: "default",
          fingerprint: plan.fingerprint,
        }),
      /Wait/,
    );
    const result = await done(app);
    assert.equal(result.jobs[0].state, "cancelled");
    assert.equal(calls, 0);
    assert.equal(result.plan.ready, false);
    assert.equal(existsSync(join(config.stateDir, "dependencies", job.id)), false);
    assert.throws(() => app.request({ op: "check-cancel", id: job.id }), /not found/);
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("dependency publication rolls back the project pointer when success persistence fails", async () => {
  const f = fixture(),
    config = {
      repo: f.repo,
      stateDir: join(f.root, "state"),
      worktrees: join(f.root, "trees"),
      logs: join(f.root, "logs"),
      command: () => [process.execPath, ["-e", ""]],
      accountStatus: () => ({ state: "signed_out" }),
      prepareDependencies: async (stage) => {
        mkdirSync(join(stage, "node_modules"));
        writeFileSync(join(stage, "node_modules", "marker"), "keep");
      },
    };
  const app = runner(config);
  await once(app.server, "listening");
  const db = new DatabaseSync(join(config.stateDir, "tasks.sqlite"));
  try {
    const plan = app.request({ op: "check-setup", project: "default" }).plan;
    app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    await done(app);
    const previous = app.request({ op: "projects" })[0].check_dependencies;
    db.exec(
      "CREATE TRIGGER fail_dependency_success BEFORE UPDATE OF state ON dependency_jobs WHEN NEW.state='succeeded' BEGIN SELECT RAISE(ABORT,'fixture publication failure'); END",
    );
    const job = app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    const result = await done(app);
    assert.equal(result.jobs[0].state, "failed");
    assert.equal(result.plan.ready, true);
    assert.equal(app.request({ op: "projects" })[0].check_dependencies, previous);
    assert.equal(readFileSync(join(previous, "marker"), "utf8"), "keep");
    assert.equal(existsSync(join(config.stateDir, "dependencies", job.id)), false);
  } finally {
    db.exec("DROP TRIGGER IF EXISTS fail_dependency_success");
    db.close();
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("startup preserves dependencies referenced by a project despite a legacy interrupted job marker", async () => {
  const f = fixture(),
    config = {
      repo: f.repo,
      stateDir: join(f.root, "state"),
      worktrees: join(f.root, "trees"),
      logs: join(f.root, "logs"),
      command: () => [process.execPath, ["-e", ""]],
      accountStatus: () => ({ state: "signed_out" }),
      prepareDependencies: async (stage) => {
        mkdirSync(join(stage, "node_modules"));
        writeFileSync(join(stage, "node_modules", "marker"), "preserve");
      },
    };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const plan = app.request({ op: "check-setup", project: "default" }).plan;
    const job = app.request({
      op: "check-prepare",
      project: "default",
      fingerprint: plan.fingerprint,
    });
    await done(app);
    const path = app.request({ op: "projects" })[0].check_dependencies;
    await app.close();
    const db = new DatabaseSync(join(config.stateDir, "tasks.sqlite"));
    db.prepare("UPDATE dependency_jobs SET state='running' WHERE id=?").run(job.id);
    db.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(readFileSync(join(path, "marker"), "utf8"), "preserve");
    const current = app.request({ op: "check-setup", project: "default" });
    assert.equal(current.jobs[0].state, "interrupted");
    assert.equal(current.plan.ready, true);
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
