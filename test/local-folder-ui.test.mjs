import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import {
  localFolderController,
  localFolderRootsText,
  renderLocalFolderPreview,
} from "../public/local-folder.js";

const list = (items, total = items.length) => ({
  total,
  items,
  truncated: total > items.length,
});
const nonGitPreview = (overrides = {}) => ({
  fingerprint: "f".repeat(64),
  canonicalPath: "/srv/projects/my app",
  pathLabel: "projects/my app",
  case: "non_git",
  stack: ["Node.js / npm"],
  dirty: false,
  branch: null,
  files: list([
    { path: "package.json", mode: "100644", size: 10 },
    { path: "bin/run.sh", mode: "100755", size: 5 },
  ]),
  ignored: {
    ...list(["node_modules/", ".env"]),
    groups: [
      { entry: "node_modules/", count: 1 },
      { entry: ".env", count: 1 },
    ],
    sensitive: 1,
  },
  refused: list([]),
  findings: list([]),
  handover: [
    {
      path: "AGENTS.md",
      content: "# Agent instructions\nRead docs/handover.md first.\n",
    },
    { path: "docs/handover.md", content: "# Handover\n" },
  ],
  keptHandover: [],
  gitOperations: [
    "git init -q -b main (AgentD-owned .git directory)",
    "Register the project",
  ],
  willCreateInitialCommit: true,
  blocked: false,
  ...overrides,
});

function harness(responses) {
  const { document, window } = parseHTML(`<!doctype html><body>
    <input id="name"><input id="path"><input id="key" type="password">
    <p id="roots"></p><div id="preview"></div><section id="jobs"></section>
    <button id="review"></button><button id="approve" hidden></button></body>`);
  const $ = (id) => document.getElementById(id);
  const calls = [],
    notices = [],
    registered = [],
    scheduled = [];
  const api = async (path, data) => {
    calls.push(data ?? { get: path });
    const reply = responses(data ?? { action: "load" }, calls.length);
    if (reply instanceof Error) throw reply;
    return reply;
  };
  const controller = localFolderController({
    doc: document,
    elements: {
      name: $("name"),
      path: $("path"),
      key: $("key"),
      roots: $("roots"),
      preview: $("preview"),
      jobs: $("jobs"),
      review: $("review"),
      approve: $("approve"),
    },
    api,
    notice: (m) => notices.push(m),
    onRegistered: (job) => registered.push(job),
    schedule: (fn) => scheduled.push(fn),
  });
  const type = (id, value) => {
    $(id).value = value;
    $(id).dispatchEvent(new window.Event("input"));
  };
  return { document, $, calls, notices, registered, scheduled, controller, type };
}

test("roots guidance names the allowlist or explains that none is configured", () => {
  assert.match(localFolderRootsText([]), /No folder roots are allowlisted/);
  assert.equal(
    localFolderRootsText([{ label: "projects", path: "/srv/projects" }]),
    "Folders must be under an allowed root on the AgentD server: /srv/projects.",
  );
});

test("the preview shows the full path, exact files, ignored entries, handover content and operations", () => {
  const { document } = parseHTML("<div id=box></div>");
  const box = document.getElementById("box");
  renderLocalFolderPreview(document, box, nonGitPreview());
  const text = box.textContent;
  assert.match(text, /\/srv\/projects\/my app/);
  assert.match(text, /Folder without Git/);
  assert.match(text, /Stack: Node\.js \/ npm/);
  const files = [...box.querySelectorAll('section[aria-label="Files to commit"] li')].map(
    (li) => li.textContent,
  );
  assert.deepEqual(files, ["package.json", "bin/run.sh (executable)"]);
  assert.match(text, /Ignored by \.gitignore \(2\)/);
  assert.match(text, /1 ignored entries look sensitive/);
  const handover = [...box.querySelectorAll("details")].map((d) => [
    d.querySelector("summary").textContent,
    d.querySelector("pre").textContent,
  ]);
  assert.deepEqual(handover, [
    ["AGENTS.md", "# Agent instructions\nRead docs/handover.md first.\n"],
    ["docs/handover.md", "# Handover\n"],
  ]);
  assert.deepEqual(
    [...box.querySelectorAll('section[aria-label="Exact operations"] li')].map(
      (li) => li.textContent,
    ),
    ["git init -q -b main (AgentD-owned .git directory)", "Register the project"],
  );
  assert.match(text, /one initial commit containing exactly the files listed above/);
});

test("an existing repository preview promises no files, no handover and no commit", () => {
  const { document } = parseHTML("<div id=box></div>");
  const box = document.getElementById("box");
  renderLocalFolderPreview(
    document,
    box,
    nonGitPreview({
      case: "existing_git",
      branch: "main",
      dirty: true,
      handover: [],
      files: list([]),
      gitOperations: ["Register the existing repository in place"],
      willCreateInitialCommit: false,
    }),
  );
  const text = box.textContent;
  assert.equal(box.querySelector('section[aria-label="Files to commit"]'), null);
  assert.match(
    text,
    /None\. Existing repositories are registered without adding files\./,
  );
  assert.match(text, /uncommitted local changes, which stay untouched/);
  assert.match(text, /No commit is created\./);
});

test("blocking findings are listed and approval stays disabled", async () => {
  const h = harness(() =>
    nonGitPreview({
      blocked: true,
      findings: list([{ path: "id_rsa", reasons: ["sensitive filename"] }]),
      refused: list([{ path: "link", reason: "symbolic link" }]),
    }),
  );
  h.type("path", "/srv/projects/app");
  await h.controller.review();
  assert.equal(h.$("approve").hidden, false);
  assert.equal(h.$("approve").disabled, true);
  const alert = h.$("preview").querySelector('[role="alert"]');
  assert.match(alert.textContent, /id_rsa — sensitive filename/);
  assert.match(alert.textContent, /link — symbolic link/);
  await h.controller.approve();
  assert.equal(
    h.calls.some((c) => c.action === "approve"),
    false,
  );
});

test("editing the path or name after preview immediately invalidates approval", async () => {
  const h = harness((data) =>
    data.action === "preview" ? nonGitPreview() : { ok: true },
  );
  h.type("path", "/srv/projects/app");
  await h.controller.review();
  assert.equal(h.$("approve").disabled, false);
  h.type("path", "/srv/projects/app2");
  assert.equal(h.$("approve").hidden, true);
  assert.equal(h.$("approve").disabled, true);
  assert.equal(h.$("preview").childElementCount, 0);
  assert.deepEqual(h.calls.at(-1), { action: "cancel" });
  await h.controller.review();
  h.type("name", "Renamed");
  assert.equal(h.$("approve").disabled, true);
});

test("a preview that returns after an edit is discarded", async () => {
  let resolve;
  const h = harness((data) =>
    data.action === "preview" ? new Promise((r) => (resolve = r)) : { ok: true },
  );
  h.type("path", "/srv/projects/app");
  const pending = h.controller.review();
  h.type("path", "/srv/projects/other");
  resolve(nonGitPreview());
  await pending;
  assert.equal(h.controller.state().preview, null);
  assert.equal(h.$("approve").hidden, true);
});

test("approval shows progress, offers cancellation and reports registration", async () => {
  let job = {
    id: "job-1",
    name: "App",
    pathLabel: "projects/app",
    state: "running",
    phase: "git_initialized",
    error: null,
    running: true,
    canCancel: true,
    needsRecovery: false,
    project: null,
    phases: [
      { phase: "approved", done: true },
      { phase: "git_initialized", done: true },
      { phase: "handover_created", done: false },
      { phase: "committed", done: false },
      { phase: "registered", done: false },
    ],
  };
  const h = harness((data) => {
    if (data.action === "preview") return nonGitPreview();
    if (data.action === "approve") return job;
    if (data.action === "load")
      return { roots: [{ label: "projects", path: "/srv/projects" }], jobs: [job] };
    return { ok: true };
  });
  h.type("path", "/srv/projects/app");
  await h.controller.review();
  h.$("key").value = "secret";
  await h.controller.approve();
  assert.deepEqual(
    h.calls.find((c) => c.action === "approve"),
    {
      action: "approve",
      fingerprint: "f".repeat(64),
      currentKey: "secret",
    },
  );
  assert.equal(h.$("key").value, "", "the access key is cleared after use");
  const steps = [...h.$("jobs").querySelectorAll("ol li")].map((li) => li.textContent);
  assert.deepEqual(steps, [
    "✓ Approved and re-checked",
    "✓ Git initialized",
    "○ Handover files created",
    "○ Initial commit created",
    "○ Project registered",
  ]);
  const cancel = [...h.$("jobs").querySelectorAll("button")].find(
    (b) => b.textContent === "Cancel import",
  );
  assert.ok(cancel);
  assert.equal(h.scheduled.length, 1, "polling is scheduled while the job runs");
  job = {
    ...job,
    state: "succeeded",
    running: false,
    canCancel: false,
    project: "p-1",
    phases: job.phases.map((p) => ({ ...p, done: true })),
  };
  await h.scheduled.shift()();
  assert.deepEqual(
    h.registered.map((j) => j.project),
    ["p-1"],
  );
  assert.equal(h.scheduled.length, 0, "polling stops when nothing runs");
});

test("recovery-required imports offer resume and rollback behind the access key", async () => {
  const job = {
    id: "job-2",
    name: "App",
    pathLabel: "projects/app",
    state: "recovery_required",
    phase: "handover_created",
    error: "Service stopped during local folder import. Resume or roll back.",
    running: false,
    canCancel: false,
    needsRecovery: true,
    project: null,
    phases: [{ phase: "approved", done: true }],
  };
  const h = harness((data) =>
    data.action === "load" ? { roots: [], jobs: [job] } : { ok: true },
  );
  await h.controller.load();
  assert.match(h.$("roots").textContent, /No folder roots are allowlisted/);
  assert.match(h.$("jobs").textContent, /Needs recovery/);
  assert.match(h.$("jobs").querySelector(".error").textContent, /Resume or roll back/);
  const buttons = Object.fromEntries(
    [...h.$("jobs").querySelectorAll("button")].map((b) => [b.textContent, b]),
  );
  await buttons["Roll back AgentD changes"].onclick();
  assert.match(h.notices.at(-1), /Enter your current access key/);
  assert.equal(
    h.calls.some((c) => c.action === "recover"),
    false,
  );
  h.$("key").value = "secret";
  await buttons["Roll back AgentD changes"].onclick();
  assert.deepEqual(
    h.calls.find((c) => c.action === "recover"),
    {
      action: "recover",
      job: "job-2",
      recovery: "rollback",
      currentKey: "secret",
    },
  );
});
