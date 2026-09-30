import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import {
  renderMarkdown,
  renderDiff,
  markdownBlocks,
  diffFiles,
  diffStats,
  formatCompactDuration,
  formatActiveStatusLabel,
  liveOutputPreview,
  composerStopControl,
  reviewProgression,
  noticeDismissMs,
  approvalSentence,
  approvalModelLine,
  applySuggestionPrompt,
  reviewCommittedProgression,
  formatTerminalStatusLabel,
  operationsSummaryCounts,
  adapterAccountActionLabel,
  adapterAccountStatusLine,
  projectNavLabel,
  conversationNavLabel,
} from "../public/ui.js";
test("operationsSummaryCounts keeps pending reviews out of Completed", () => {
  assert.deepEqual(
    operationsSummaryCounts({
      waiting_for_approval: 1,
      queued: 0,
      running: 0,
      cancelling: 0,
      succeeded: 2,
      review_pending: 1,
      succeeded_complete: 1,
      failed: 0,
      timed_out: 0,
      interrupted: 0,
    }),
    {
      active: 1,
      completed: 1,
      awaitingReview: 1,
      problems: 0,
      queued: 0,
    },
  );
});
test("formatTerminalStatusLabel keeps Ask answers distinct from reviews", () => {
  assert.equal(
    formatTerminalStatusLabel({ status: "succeeded", mode: "ask", review: null }),
    "Answer ready",
  );
  assert.equal(
    formatTerminalStatusLabel({
      status: "succeeded",
      mode: "edit",
      review: "pending",
    }),
    "Changes ready for review",
  );
  assert.equal(
    formatTerminalStatusLabel({
      status: "succeeded",
      mode: "edit",
      review: "committed",
    }),
    "Committed",
  );
  assert.equal(
    formatTerminalStatusLabel({ status: "failed" }, { failed: "Failed" }),
    "Failed",
  );
});
test("adapterAccountActionLabel distinguishes disabled adapters from Sign in", () => {
  assert.equal(
    adapterAccountActionLabel({
      enabled: false,
      installed: true,
      accountState: "signed_out",
    }),
    "Sign in for later",
  );
  assert.equal(
    adapterAccountActionLabel({
      enabled: true,
      installed: true,
      accountState: "signed_out",
    }),
    "Sign in",
  );
  assert.equal(
    adapterAccountActionLabel({
      enabled: false,
      installed: true,
      accountState: "signed_in",
    }),
    "Reconnect account",
  );
});
test("adapterAccountStatusLine keeps disabled signed-out muted", () => {
  assert.deepEqual(
    adapterAccountStatusLine({
      enabled: false,
      account: { state: "signed_out", message: "Sign-in required" },
    }),
    { text: "Account not signed in", className: "muted" },
  );
  assert.deepEqual(
    adapterAccountStatusLine({
      enabled: true,
      account: { state: "signed_out", message: "Sign-in required" },
    }),
    { text: "Sign-in required", className: "attention" },
  );
  assert.deepEqual(
    adapterAccountStatusLine({
      enabled: false,
      account: { state: "signed_in", method: "Cursor account" },
    }),
    { text: "Signed in · Cursor account", className: "good" },
  );
  assert.deepEqual(
    adapterAccountStatusLine({
      enabled: true,
      account: { state: "unavailable", message: "" },
    }),
    { text: "Account status unavailable", className: "muted" },
  );
});
test("projectNavLabel explains conversation counts for sidebar badges", () => {
  assert.deepEqual(projectNavLabel("Demo", 0), {
    title: "Demo",
    countLabel: "0 conversations",
    accessibleName: "Demo, 0 conversations",
  });
  assert.deepEqual(projectNavLabel("Demo", 1), {
    title: "Demo",
    countLabel: "1 conversation",
    accessibleName: "Demo, 1 conversation",
  });
});
test("conversationNavLabel names threads for assistive tech", () => {
  assert.deepEqual(conversationNavLabel("Plan checks", "Answer ready"), {
    title: "Plan checks",
    statusLabel: "Answer ready",
    accessibleName: "Plan checks, Answer ready",
  });
});
test("reviewCommittedProgression prefers publish after fresh checks", () => {
  assert.deepEqual(
    reviewCommittedProgression({ checksInput: "other", checksStatus: "passed" }),
    {
      primary: "recheck",
      next: "These committed files need fresh snapshot checks before publication.",
    },
  );
  assert.equal(
    reviewCommittedProgression({
      checksInput: "git-tree-v1",
      checksStatus: "passed",
    }).primary,
    "publish",
  );
});
test("applySuggestionPrompt fills without submitting and parks the caret", () => {
  const field = {
    value: "",
    setSelectionRange(start, end) {
      this.start = start;
      this.end = end;
    },
  };
  const applied = applySuggestionPrompt(field, "Explain this project");
  assert.equal(field.value, "Explain this project");
  assert.equal(field.start, field.value.length);
  assert.equal(field.end, field.value.length);
  assert.match(applied.hint, /Suggestion filled/);
  assert.equal(applySuggestionPrompt(null, "x").hint, "");
});
test("approvalSentence states one honest promise before Run", () => {
  assert.equal(
    approvalSentence(
      {
        timeoutMs: 120000,
        settings: { access: "read" },
        permissions: { filesystem: "Read-only" },
      },
      { adapter: "claude", mode: "ask" },
    ),
    "Claude will read your project and answer. Nothing is changed. Runs up to 2 min.",
  );
  assert.match(
    approvalSentence(
      { timeoutMs: 60000, settings: { access: "edit" } },
      { adapter: "cursor", mode: "edit" },
    ),
    /Cursor will edit an isolated copy/,
  );
  assert.equal(
    approvalModelLine({ model: "provider", effort: "high" }),
    "Provider default model · high effort",
  );
});
test("noticeDismissMs keeps confirmations short and errors readable", () => {
  assert.equal(noticeDismissMs("info"), 5000);
  assert.equal(noticeDismissMs(), 5000);
  assert.equal(noticeDismissMs("error"), 8000);
});
test("reviewProgression exposes one primary step with honest guidance", () => {
  assert.equal(
    reviewProgression({
      conflicts: ["a"],
      blocked: [],
      checksReady: true,
      passed: false,
      filesLength: 1,
    }).primary,
    "revise",
  );
  assert.equal(
    reviewProgression({
      blocked: [],
      checksReady: false,
      passed: false,
      filesLength: 1,
    }).primary,
    "setup",
  );
  assert.equal(
    reviewProgression({
      blocked: [],
      checksReady: true,
      passed: false,
      filesLength: 2,
    }).primary,
    "checks",
  );
  const ready = reviewProgression({
    blocked: [],
    checksReady: true,
    passed: true,
    filesLength: 1,
  });
  assert.equal(ready.primary, "commit");
  assert.equal(ready.commitReady, true);
  assert.match(ready.next, /Commit when the message/);
});
test("composerStopControl replaces Send while a run is active", () => {
  assert.deepEqual(composerStopControl("running"), {
    visible: true,
    label: "■ Stop",
    disabled: false,
    mode: "stop",
  });
  assert.deepEqual(composerStopControl("queued"), {
    visible: true,
    label: "■ Stop",
    disabled: false,
    mode: "stop",
  });
  assert.deepEqual(composerStopControl("cancelling"), {
    visible: true,
    label: "Stopping…",
    disabled: true,
    mode: "stopping",
  });
  assert.deepEqual(composerStopControl("waiting_for_approval"), {
    visible: true,
    label: "Cancel",
    disabled: false,
    mode: "cancel",
  });
  assert.equal(composerStopControl("succeeded").visible, false);
});
test("liveOutputPreview keeps a trailing bounded plain-text window", () => {
  assert.deepEqual(liveOutputPreview(""), { text: "", truncated: false });
  assert.deepEqual(liveOutputPreview("hello"), { text: "hello", truncated: false });
  const long = "keep\n" + "x".repeat(7000);
  const preview = liveOutputPreview(long, 6000);
  assert.equal(preview.truncated, true);
  assert.ok(preview.text.length <= 6000);
  assert.equal(preview.text.includes("\u001b"), false);
  assert.equal(liveOutputPreview("a\u001b[31mred\u001b[0mb").text, "aredb");
  assert.match(liveOutputPreview("<script>alert(1)</script>").text, /<script>/);
});
test("compact duration and active status labels stay honest and short", () => {
  assert.equal(formatCompactDuration(0), "0s");
  assert.equal(formatCompactDuration(45), "45s");
  assert.equal(formatCompactDuration(72), "1m 12s");
  assert.equal(formatCompactDuration(3600), "1h 0m");
  const now = Date.parse("2026-09-30T12:00:45.000Z");
  assert.equal(
    formatActiveStatusLabel("waiting_for_approval", "2026-09-30T12:00:00.000Z", now),
    "Ready for your approval · waiting 45s",
  );
  assert.equal(
    formatActiveStatusLabel("running", "2026-09-30T11:59:33.000Z", now),
    "Working · 1m 12s",
  );
  assert.equal(
    formatActiveStatusLabel("queued", "2026-09-30T11:59:50.000Z", now),
    "Queued · 55s",
  );
  assert.equal(
    formatActiveStatusLabel("cancelling", "2026-09-30T12:00:40.000Z", now),
    "Stopping · 5s",
  );
});
test("untrusted answers render as inert text with bounded Markdown and no remote resources", () => {
  const { document } = parseHTML("<html><body></body></html>");
  globalThis.document = document;
  try {
    const input =
      '# Answer\n\n**Important** `code`\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[click](javascript:alert(1))\n![remote](https://example.com/tracker)\n\n```html\n<iframe src="https://example.com"></iframe>\n```';
    const answer = renderMarkdown(input);
    assert.equal(answer.querySelector("h2").textContent, "Answer");
    assert.equal(answer.querySelector("strong").textContent, "Important");
    assert.equal(answer.querySelectorAll("script,img,iframe,a,[onerror]").length, 0);
    assert.match(answer.textContent, /<script>alert/);
    assert.equal(
      answer.querySelector(".code-block code").textContent,
      '<iframe src="https://example.com"></iframe>',
    );
    assert.ok(markdownBlocks("a".repeat(300000))[0].text.length <= 200000);
    assert.equal(
      renderMarkdown("```js\nunclosed").querySelector("code").textContent,
      "unclosed",
    );
  } finally {
    delete globalThis.document;
  }
});
test("file review retains exact hostile lines as text and separates files with line numbers", () => {
  const { document } = parseHTML("<html><body></body></html>");
  globalThis.document = document;
  try {
    const patch =
      "diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-<img src=x>\n+<script>x</script>\ndiff --git a/b b/b\n@@ -0,0 +1 @@\n+hello";
    const view = renderDiff(patch);
    assert.equal(view.querySelectorAll("details").length, 2);
    assert.equal(view.querySelectorAll("script,img").length, 0);
    assert.match(view.querySelector(".addition").textContent, /<script>x<\/script>/);
    assert.ok(view.querySelector(".line-number"));
  } finally {
    delete globalThis.document;
  }
});
test("workspace has unique controls, keyboard-accessible attachment input and named navigation", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const ids = [...document.querySelectorAll("[id]")].map((n) => n.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of [
    "mode",
    "adapter",
    "drawer-open",
    "preferences-menu",
    "run-options",
    "project-menu",
    "diagnostics-settings",
    "diagnostics-dialog",
    "diagnostics-content",
  ])
    assert.ok(document.getElementById(id), id);
  assert.equal(document.getElementById("files").hasAttribute("hidden"), false);
  assert.equal(
    document.getElementById("drawer-open").getAttribute("aria-controls"),
    "sidebar",
  );
  assert.match(
    document.getElementById("project-form").textContent,
    /only after supported npm checks pass/,
  );
  const projectFields = [...document.getElementById("project-form").children].map(
    (n) => n.id || n.tagName.toLowerCase(),
  );
  assert.deepEqual(projectFields.slice(0, 4), ["h2", "label", "project-input", "p"]);
  assert.ok(
    projectFields.indexOf("import-open") > projectFields.indexOf("project-input"),
  );
});
test("file review shows every hunk line, including content that looks like a patch header", () => {
  const { document } = parseHTML("<html><body></body></html>");
  globalThis.document = document;
  try {
    const patch = [
      "diff --git a/q.sql b/q.sql",
      "index 1111111..2222222 100644",
      "--- a/q.sql",
      "+++ b/q.sql",
      "@@ -1,3 +1,3 @@",
      " SELECT 1;",
      "--- drop the audit trigger",
      "+++ new header marker",
      "+index looks like metadata",
      " SELECT 2;",
      "\\ No newline at end of file",
    ].join("\n");
    const view = renderDiff(patch),
      text = view.textContent;
    for (const line of [
      "--- drop the audit trigger",
      "+++ new header marker",
      "+index looks like metadata",
      "\\ No newline at end of file",
    ])
      assert.ok(text.includes(line), line);
    assert.equal(view.querySelectorAll(".deletion").length, 1);
    assert.equal(view.querySelectorAll(".addition").length, 2);
    assert.equal(view.querySelector(".file-name").textContent, "q.sql");
    assert.equal(view.querySelector(".file-counts").textContent, "+2 −1");
    assert.equal(text.includes("index 1111111"), false);
  } finally {
    delete globalThis.document;
  }
});
test("patch metadata becomes file status, names come from headers and counts exclude headers", () => {
  const patch = [
    "diff --git a/new file.txt b/new file.txt",
    "new file mode 100644",
    "index 0000000..e69de29",
    "--- /dev/null",
    "+++ b/new file.txt",
    "@@ -0,0 +1 @@",
    "+hello",
    "diff --git a/gone.txt b/gone.txt",
    "deleted file mode 100644",
    "--- a/gone.txt",
    "+++ /dev/null",
    "@@ -1 +0,0 @@",
    "-bye",
    "diff --git a/old.js b/new.js",
    "similarity index 90%",
    "rename from old.js",
    "rename to new.js",
    "--- a/old.js",
    "+++ b/new.js",
    "@@ -1 +1 @@",
    "-a",
    "+b",
    "diff --git a/logo.png b/logo.png",
    "Binary files a/logo.png and b/logo.png differ",
    "",
  ].join("\n");
  const files = diffFiles(patch);
  assert.deepEqual(
    files.map((f) => [f.name, f.status, f.additions, f.deletions, f.binary]),
    [
      ["new file.txt", "added", 1, 0, false],
      ["gone.txt", "deleted", 0, 1, false],
      ["new.js", "renamed", 1, 1, false],
      ["logo.png", "modified", 0, 0, true],
    ],
  );
  assert.equal(files[2].from, "old.js");
  assert.deepEqual(diffStats(patch), { files: 4, additions: 2, deletions: 2 });
});
