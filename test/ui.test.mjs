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
  noticeRole,
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
  brandMarkElement,
  disabledOptionReason,
  openDialog,
  setTextWithTitle,
  emptyConversationList,
  emptyProjectList,
  noProjectActionReason,
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
test("brandMarkElement returns a decorative SVG diamond", () => {
  const { document } = parseHTML("<html><body></body></html>");
  const mark = brandMarkElement(document);
  assert.equal(mark.tagName.toLowerCase(), "svg");
  assert.equal(mark.getAttribute("aria-hidden"), "true");
  assert.equal(mark.getAttribute("class"), "brand-mark");
  assert.ok(mark.querySelector("path"));
});
test("workspace brand uses an SVG mark instead of the text glyph", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /class="brand-mark"/);
  assert.equal(html.includes("◈ agentd"), false);
});
test("disabledOptionReason explains unavailable adapter and mode choices", () => {
  assert.equal(
    disabledOptionReason("adapter", "Adapter disabled by security policy"),
    "Unavailable: not enabled on this server",
  );
  assert.equal(disabledOptionReason("mode", "Claude"), "Not available for Claude");
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
test("noticeRole marks errors as alerts and info as status", () => {
  assert.equal(noticeRole("info"), "status");
  assert.equal(noticeRole("error"), "alert");
});
test("page notice starts as a polite status region", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /id="notice"[^>]*role="status"/);
  assert.match(html, /id="notice"[^>]*aria-live="polite"/);
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
    accessibleName: "Stop run",
    disabled: false,
    mode: "stop",
  });
  assert.deepEqual(composerStopControl("queued"), {
    visible: true,
    label: "■ Stop",
    accessibleName: "Stop run",
    disabled: false,
    mode: "stop",
  });
  assert.deepEqual(composerStopControl("cancelling"), {
    visible: true,
    label: "Stopping…",
    accessibleName: "Stopping",
    disabled: true,
    mode: "stopping",
  });
  assert.deepEqual(composerStopControl("waiting_for_approval"), {
    visible: true,
    label: "Cancel",
    accessibleName: "Cancel approval",
    disabled: false,
    mode: "cancel",
  });
  assert.equal(composerStopControl("succeeded").visible, false);
});
test("composer Send and Stop expose stable accessible names", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("send").getAttribute("aria-label"),
    "Send message",
  );
  assert.equal(
    document.getElementById("stop-current").getAttribute("aria-label"),
    "Stop run",
  );
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
    const copy = answer.querySelector(".code-head button");
    assert.equal(copy.textContent, "Copy code");
    assert.equal(copy.getAttribute("aria-label"), "Copy code");
    assert.equal(copy.getAttribute("aria-live"), "polite");
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
    "attach",
  ])
    assert.ok(document.getElementById(id), id);
  const attach = document.getElementById("attach");
  const files = document.getElementById("files");
  assert.equal(attach.tagName, "BUTTON");
  assert.equal(attach.getAttribute("aria-label"), "Attach images");
  assert.equal(attach.getAttribute("aria-controls"), "files");
  assert.equal(files.className, "sr-only");
  assert.equal(files.getAttribute("tabindex"), "-1");
  assert.equal(files.getAttribute("aria-hidden"), "true");
  assert.equal(files.hasAttribute("hidden"), false);
  assert.equal(
    document.getElementById("drawer-open").getAttribute("aria-controls"),
    "sidebar",
  );
  assert.equal(
    document.getElementById("run-options").getAttribute("aria-label"),
    "Change model and effort",
  );
  for (const id of ["drawer-open", "drawer-close", "conversation-menu"]) {
    const el =
      id === "conversation-menu"
        ? document.querySelector("#conversation-menu > summary")
        : document.getElementById(id);
    assert.ok(el.querySelector('[aria-hidden="true"]'), id);
  }
  assert.match(
    document.getElementById("project-form").textContent,
    /only after supported npm checks pass/,
  );
  const projectFields = [...document.getElementById("project-form").children].map(
    (n) => n.id || n.tagName.toLowerCase(),
  );
  assert.deepEqual(projectFields.slice(0, 4), [
    "project-heading-group",
    "label",
    "project-input",
    "p",
  ]);
  assert.equal(
    document.getElementById("project-heading-group").getAttribute("role"),
    "group",
  );
  assert.equal(
    document.getElementById("project-heading-group").getAttribute("aria-label"),
    "New project heading",
  );
  assert.ok(document.getElementById("project-heading"));
  assert.ok(
    projectFields.indexOf("import-open") > projectFields.indexOf("project-input"),
  );
});
test("conversation disclosures replace browser-default triangles", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.turn summary::-webkit-details-marker/);
  assert.match(css, /\.file-review summary::-webkit-details-marker/);
  assert.match(css, /\.turn summary::before/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
test("phone layout keeps primary controls at least 44px tall", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /#send/);
  assert.match(phone, /min-height: 44px/);
  assert.match(phone, /#prompt \{\s*font-size: 16px;/);
  assert.match(phone, /\.code-head button \{[^}]*min-height: 44px/s);
});
test("theme-color meta stays in the document head", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const meta = document.querySelector('meta[name="theme-color"]');
  assert.ok(meta);
  assert.equal(meta.getAttribute("content"), "#f7f6f3");
  assert.match(
    readFileSync(new URL("../public/ui.js", import.meta.url), "utf8"),
    /themeColor\.content = dark \? "#1b1a18" : "#f7f6f3"/,
  );
});
test("phone composer keeps Send on the same row as tools", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /\.compose-foot \{[^}]*flex-wrap: nowrap/);
  assert.match(phone, /#send \{[^}]*white-space: nowrap/);
});
test("phone drawer and sheets animate with reduced-motion respect", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /#sidebar \{[^}]*transition:/s);
  assert.match(phone, /transform 0\.24s ease-out/);
  assert.match(phone, /safe-area-inset-top/);
  assert.match(phone, /#sidebar \{[^}]*safe-area-inset-bottom/s);
  assert.match(phone, /dialog\[open\] \{[^}]*animation: agentd-sheet-up/s);
  assert.match(css, /@keyframes agentd-sheet-up/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition: none !important/);
});
test("phone review footer respects the home-indicator safe area", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /#review-actions \{[^}]*safe-area-inset-bottom/s);
  assert.match(phone, /#review-actions \{[^}]*bottom: 0/s);
});
test("phone header respects the status-bar safe area", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /header \{[^}]*safe-area-inset-top/s);
});
test("phone login respects safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /\.login \{[^}]*safe-area-inset-top/s);
  assert.match(phone, /\.login \{[^}]*safe-area-inset-bottom/s);
});
test("phone notice toast respects the home-indicator safe area", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(phone, /#notice \{[^}]*safe-area-inset-bottom/s);
});
test("status and outcome classes keep non-colour cues", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.status\.running[\s\S]*font-weight: 600/);
  assert.match(css, /\.status\.failed[\s\S]*text-decoration: underline/);
  assert.match(css, /\.good \{[\s\S]*font-weight: 600/);
  assert.match(css, /\.attention \{[\s\S]*font-weight: 600/);
});
test("dialog close controls share a consistent 44px target", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.review-head button \{[\s\S]*min-width: 44px/);
  assert.match(css, /\.review-head button \{[\s\S]*min-height: 44px/);
});
test("dialog close buttons expose accessible names", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const closes = [...html.matchAll(/aria-label="Close[^"]*"/g)];
  assert.ok(closes.length >= 8, "expected several Close aria-labels");
  const glyphCloses = [
    ...html.matchAll(
      /aria-label="Close[^"]*"[^>]*>\s*<span aria-hidden="true">×<\/span>/g,
    ),
  ];
  assert.ok(glyphCloses.length >= 8, "Close × glyphs should be decorative");
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /Close account dialog[\s\S]*aria-hidden[\s\S]*×/);
});
test("selected sidebar items keep a non-colour cue", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.selected \{[\s\S]*font-weight: 600/);
  assert.match(css, /\.selected \{[\s\S]*box-shadow: inset 3px 0 0/);
});
test("openDialog restores focus to the trigger when the dialog closes", () => {
  const listeners = {};
  const trigger = {
    focused: 0,
    focus() {
      this.focused += 1;
    },
  };
  const dialog = {
    open: false,
    showModal() {
      this.open = true;
    },
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
  };
  openDialog(dialog, trigger);
  assert.equal(dialog.open, true);
  assert.equal(dialog.__agentdReturnFocus, trigger);
  openDialog(dialog, { focus() {} });
  assert.equal(dialog.__agentdReturnFocus, trigger, "re-open keeps original trigger");
  dialog.open = false;
  listeners.close();
  assert.equal(trigger.focused, 1);
  assert.equal(dialog.__agentdReturnFocus, null);
});
test("app opens dialogs through openDialog for focus restoration", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /openDialog\(/);
  assert.equal([...source.matchAll(/\.showModal\(/g)].length, 0);
  assert.match(
    source,
    /history-menu[\s\S]*openDialog\(\$\("history-dialog"\)\)[\s\S]*\$\("history-query"\)\.focus\(\)/,
  );
  assert.match(
    source,
    /add-project[\s\S]*openDialog\(\$\("project-dialog"\)\)[\s\S]*\$\("project-input"\)\.focus\(\)/,
  );
});
test("history search field is ready for immediate typing", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.ok(document.getElementById("history-query").hasAttribute("autofocus"));
  assert.ok(document.getElementById("project-input").hasAttribute("autofocus"));
  const results = document.getElementById("history-results");
  assert.equal(results.getAttribute("aria-live"), "polite");
  assert.equal(results.getAttribute("aria-busy"), "false");
  assert.equal(
    document.getElementById("loginform").getAttribute("aria-describedby"),
    "login-blurb",
  );
  assert.ok(document.getElementById("login-blurb"));
});
test("history search marks results busy while loading", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /results\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /results\.setAttribute\("aria-busy", "false"\)/);
});
test("history pagination exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("history-pages").getAttribute("aria-label"),
    "History pagination",
  );
  assert.equal(
    document.getElementById("archived-projects").getAttribute("aria-label"),
    "Archived projects",
  );
  assert.equal(
    document.getElementById("history-menu").getAttribute("aria-label"),
    "Search and history",
  );
  assert.equal(
    document.getElementById("operations-menu").getAttribute("aria-label"),
    "Activity",
  );
  assert.equal(
    document.getElementById("preferences-menu").getAttribute("aria-label"),
    "Settings",
  );
});
test("sidebar foot exposes a workspace tools landmark name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const foot = document.querySelector(".sidebar-foot");
  assert.equal(foot.getAttribute("role"), "navigation");
  assert.equal(foot.getAttribute("aria-label"), "Workspace tools");
});
test("welcome suggestion chips expose stable accessible names", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "Suggested prompts"/);
  assert.match(source, /Use suggestion: " \+ text/);
  assert.match(source, /welcome-icon[\s\S]*aria-hidden[\s\S]*brandMarkElement/s);
  assert.match(source, /agentGlyph\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(source, /"▱ "[\s\S]*aria-hidden[\s\S]*nav\.title/s);
});
test("Escape closes run-picker and conversation menus outside dialogs", () => {
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(source, /keydown[\s\S]*Escape[\s\S]*run-picker[\s\S]*conversation-menu/s);
  assert.match(source, /dialog\[open\]/);
});
test("conversation region marks busy while workspace refresh runs", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(document.getElementById("detail").getAttribute("aria-busy"), "false");
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /detail"\)\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /detail"\)\?\.setAttribute\("aria-busy", "false"\)/);
});
test("composer menus sync aria-expanded on their summaries", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  for (const id of ["conversation-menu", "run-picker"]) {
    const summary = document.getElementById(id).querySelector("summary");
    assert.equal(summary.getAttribute("aria-expanded"), "false", id);
  }
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(source, /aria-expanded", String\(menu\.open\)/);
});
test("attachment chips expose remove accessible names", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("attachments").getAttribute("aria-label"),
    "Attached images",
  );
  assert.equal(
    document.getElementById("attachments").getAttribute("aria-live"),
    "polite",
  );
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /Remove attachment: " \+ item\.name/);
});
test("compose form is named and described by composer hints", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const form = document.getElementById("compose");
  assert.equal(form.getAttribute("aria-label"), "Compose message");
  assert.equal(form.getAttribute("aria-describedby"), "hint policy-hint draft-hint");
});
test("conversation image links expose open-attachment names", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /Open attached image: " \+ item\.name/);
  assert.match(source, /aria-label", "Attached images"/);
});
test("main desk exposes a conversation workspace landmark name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.querySelector("main.desk").getAttribute("aria-label"),
    "Conversation workspace",
  );
});
test("login section exposes a sign-in landmark name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("login").getAttribute("aria-label"),
    "Sign in to agentd",
  );
});
test("signed-in workspace exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("workspace").getAttribute("aria-label"),
    "agentd workspace",
  );
});
test("composer wrap exposes a complementary landmark name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const wrap = document.querySelector(".composer-wrap");
  assert.equal(wrap.getAttribute("role"), "complementary");
  assert.equal(wrap.getAttribute("aria-label"), "Message composer");
});
test("user-facing copy names the Activity surface, not Operations", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /Open Activity to start/);
  assert.match(app, /reconnect in Activity if it reports/);
  assert.equal(app.includes("Open Operations"), false);
  assert.equal(app.includes("in Operations"), false);
  const errors = readFileSync(
    new URL("../src/public-error-messages.ts", import.meta.url),
    "utf8",
  );
  assert.match(errors, /in Activity/);
  assert.equal(errors.includes("in Operations"), false);
});
test("workspace offers a skip link into the conversation region", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /class="skip-link"[^>]*href="#detail"/);
  assert.match(html, /id="detail"[^>]*tabindex="-1"/);
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.skip-link:focus/);
});
test("setTextWithTitle keeps truncated labels discoverable", () => {
  const el = {
    textContent: "",
    title: "",
    removeAttribute(name) {
      if (name === "title") this.title = "";
    },
  };
  assert.equal(setTextWithTitle(el, "Long project name"), "Long project name");
  assert.equal(el.title, "Long project name");
  setTextWithTitle(el, "");
  assert.equal(el.title, "");
});
test("emptyConversationList offers a New conversation control", () => {
  const { document } = parseHTML("<!doctype html><html><body></body></html>");
  const empty = emptyConversationList(document);
  assert.equal(empty.copy.textContent, "Your conversations will appear here.");
  assert.equal(empty.start.textContent, "＋ New conversation");
  assert.equal(empty.start.getAttribute("aria-label"), "New conversation");
  assert.equal(empty.start.querySelector('[aria-hidden="true"]')?.textContent, "＋");
  assert.match(empty.start.className, /empty-list-cta/);
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.empty-list-cta/);
});
test("emptyProjectList offers a New project control", () => {
  const { document } = parseHTML("<!doctype html><html><body></body></html>");
  const empty = emptyProjectList(document);
  assert.equal(empty.copy.textContent, "Create a project to start working.");
  assert.equal(empty.start.textContent, "＋ New project");
  assert.equal(empty.start.getAttribute("aria-label"), "Create or import project");
  assert.equal(empty.start.querySelector('[aria-hidden="true"]')?.textContent, "＋");
  assert.match(empty.start.className, /empty-list-cta/);
});
test("sidebar New conversation exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const neu = document.getElementById("new");
  assert.equal(neu.getAttribute("aria-label"), "New conversation");
  assert.equal(neu.querySelector('[aria-hidden="true"]')?.textContent, "＋");
});
test("Send arrow glyph is decorative beside its accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const send = document.getElementById("send");
  assert.equal(send.getAttribute("aria-label"), "Send message");
  assert.equal(send.querySelector('[aria-hidden="true"]')?.textContent, "↑");
});
test("composer hints announce changes politely", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  for (const id of ["draft-hint", "policy-hint", "hint", "agent-reasons"]) {
    const tag = html.match(new RegExp(`<p[^>]*id="${id}"[^>]*>`));
    assert.ok(tag, id);
    assert.match(tag[0], /aria-live="polite"/);
  }
  assert.match(
    html.match(/<span[^>]*id="selection-summary"[^>]*>/)[0],
    /aria-live="polite"/,
  );
  for (const id of ["picker-summary", "picker-mode"]) {
    assert.match(
      html.match(new RegExp(`<span[^>]*id="${id}"[^>]*>`))[0],
      /aria-live="polite"/,
    );
  }
  for (const id of ["mode", "adapter"]) {
    const tag = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>`));
    assert.ok(tag, id);
    assert.match(tag[0], /aria-describedby="agent-reasons"/);
  }
});
test("noProjectActionReason explains blocked new/send without a project", () => {
  assert.match(noProjectActionReason("new"), /project first/i);
  assert.match(noProjectActionReason("send"), /project to send/i);
});
test("connection status hides the decorative bullet from assistive tech", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /class="connection"[^>]*>[\s\S]*aria-hidden="true">●/);
  assert.match(html, /Connected to your workspace/);
});
test("login access key is autofocused", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(document.getElementById("key").hasAttribute("autofocus"), true);
});
test("workspace dialogs expose labelled headings", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const dialogs = [...document.querySelectorAll("dialog[id]")];
  assert.ok(dialogs.length >= 12);
  for (const dialog of dialogs) {
    const labelledby = dialog.getAttribute("aria-labelledby");
    assert.ok(labelledby, dialog.id);
    assert.ok(document.getElementById(labelledby), `${dialog.id} -> ${labelledby}`);
  }
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

test("review and run content announce updates politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("review-content").getAttribute("aria-live"),
    "polite",
  );
  assert.equal(
    document.getElementById("run-content").getAttribute("aria-live"),
    "polite",
  );
});

test("conversation workspace header exposes a landmark name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const header = document.querySelector("main.desk > header");
  assert.equal(header.getAttribute("aria-label"), "Conversation heading");
});

test("page notice toast announces politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const notice = document.getElementById("notice");
  assert.equal(notice.getAttribute("role"), "status");
  assert.equal(notice.getAttribute("aria-live"), "polite");
});

test("thread title is described by the project name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("thread-title").getAttribute("aria-describedby"),
    "project-name",
  );
});

test("review stats announce updates politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("review-stats").getAttribute("aria-live"),
    "polite",
  );
});

test("history results expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("history-results").getAttribute("aria-label"),
    "Search results",
  );
});

test("history form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("history-form").getAttribute("aria-label"),
    "Search history",
  );
});

test("review actions expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("review-actions").getAttribute("aria-label"),
    "Review next steps",
  );
});

test("project form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("project-form").getAttribute("aria-label"),
    "Create project",
  );
});

test("revision status announces updates politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const el = document.getElementById("revision-status");
  assert.equal(el.getAttribute("role"), "status");
  assert.equal(el.getAttribute("aria-live"), "polite");
});

test("repository form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("repository-form").getAttribute("aria-label"),
    "Find GitHub repository",
  );
});

test("repository import form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("repository-import").getAttribute("aria-label"),
    "Import repository",
  );
});

test("revision form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("revision-form").getAttribute("aria-label"),
    "Request revisions",
  );
});

test("publishing form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("publishing-form").getAttribute("aria-label"),
    "Publish to GitHub",
  );
});

test("publication confirm form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("publication-confirm-form").getAttribute("aria-label"),
    "Confirm publication",
  );
});

test("login form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("loginform").getAttribute("aria-label"),
    "Sign in",
  );
});

test("access key content announces updates politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("access-key-content").getAttribute("aria-live"),
    "polite",
  );
});

test("feedback form exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("feedback-form").getAttribute("aria-label"),
    "GitHub feedback",
  );
});

test("project info exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("project-info").getAttribute("aria-label"),
    "Project information",
  );
});

test("settings accounts expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("settings-accounts").getAttribute("aria-label"),
    "Agent accounts",
  );
});

test("operations content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("operations-content").getAttribute("aria-label"),
    "Activity list",
  );
});

test("github content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("github-content").getAttribute("aria-label"),
    "GitHub connection status",
  );
});

test("check setup content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("check-setup-content").getAttribute("aria-label"),
    "Check setup",
  );
});

test("updates content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("updates-content").getAttribute("aria-label"),
    "Updates",
  );
});

test("cli content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("cli-content").getAttribute("aria-label"),
    "Agents and CLIs",
  );
});

test("diagnostics content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("diagnostics-content").getAttribute("aria-label"),
    "Server diagnostics",
  );
});

test("configuration content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("configuration-content").getAttribute("aria-label"),
    "Configuration",
  );
});

test("backups content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("backups-content").getAttribute("aria-label"),
    "Managed backups",
  );
});

test("publishing content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("publishing-content").getAttribute("aria-label"),
    "Publication preview",
  );
});

test("repository status exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("repository-status").getAttribute("aria-label"),
    "Repository status",
  );
});

test("review content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("review-content").getAttribute("aria-label"),
    "Reviewed changes",
  );
});

test("run content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("run-content").getAttribute("aria-label"),
    "Run activity",
  );
});

test("feedback content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("feedback-content").getAttribute("aria-label"),
    "GitHub feedback results",
  );
});

test("project info announces updates politely", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("project-info").getAttribute("aria-live"),
    "polite",
  );
});

test("phone drawer clears left safe-area inset", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /#sidebar\s*\{[\s\S]*?padding-left:\s*max\(0px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone conversation region clears horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /#detail\s*\{\s*padding:\s*22px\s+max\(16px,\s*env\(safe-area-inset-right\)\)\s+22px\s+max\(16px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone composer clears horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.composer-wrap\s*\{\s*padding:\s*8px\s+max\(12px,\s*env\(safe-area-inset-right\)\)\s+max\(10px,\s*env\(safe-area-inset-bottom\)\)\s+max\(12px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone dialogs clear horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /dialog\s*\{[\s\S]*?padding:\s*max\(20px,\s*env\(safe-area-inset-top\)\)\s+max\(16px,\s*env\(safe-area-inset-right\)\)\s+max\(20px,\s*env\(safe-area-inset-bottom\)\)\s+max\(16px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone conversation header clears horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /header\s*\{\s*padding:\s*max\(12px,\s*env\(safe-area-inset-top\)\)\s+max\(12px,\s*env\(safe-area-inset-right\)\)\s+12px\s+max\(12px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone notice toast clears horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /#notice\s*\{[\s\S]*?max-width:\s*min\(\s*600px,\s*calc\(100vw\s*-\s*32px\s*-\s*env\(safe-area-inset-left\)\s*-\s*env\(safe-area-inset-right\)\)/,
  );
});

test("phone review sticky footer clears horizontal safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /#review-actions\s*\{\s*bottom:\s*0;\s*padding:\s*16px\s+max\(16px,\s*env\(safe-area-inset-right\)\)\s+max\(16px,\s*env\(safe-area-inset-bottom\)\)\s+max\(16px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("phone drawer clears right safe-area inset", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /#sidebar\s*\{[\s\S]*?padding-right:\s*max\(0px,\s*env\(safe-area-inset-right\)\)/,
  );
});

test("access key content exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("access-key-content").getAttribute("aria-label"),
    "Access key",
  );
});

test("revision status exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("revision-status").getAttribute("aria-label"),
    "Revision status",
  );
});

test("draft hint exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("draft-hint").getAttribute("aria-label"),
    "Saved draft",
  );
});

test("policy hint exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("policy-hint").getAttribute("aria-label"),
    "Capability policy",
  );
});

test("composer hint exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("hint").getAttribute("aria-label"),
    "Composer status",
  );
});

test("selection summary exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("selection-summary").getAttribute("aria-label"),
    "Model and effort",
  );
});

test("agent reasons expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("agent-reasons").getAttribute("aria-label"),
    "Agent capabilities",
  );
});

test("picker summary exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("picker-summary").getAttribute("aria-label"),
    "Selected agent",
  );
});

test("picker mode exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("picker-mode").getAttribute("aria-label"),
    "Selected mode",
  );
});

test("review stats expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("review-stats").getAttribute("aria-label"),
    "Review change stats",
  );
});

test("page notice exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("notice").getAttribute("aria-label"),
    "Page notice",
  );
});

test("connection status exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("connection-status").getAttribute("aria-label"),
    "Connection status",
  );
});

test("publication confirm error exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("publication-confirm-error").getAttribute("aria-label"),
    "Publication error",
  );
});

test("publication confirm text exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("publication-confirm-text").getAttribute("aria-label"),
    "Publication summary",
  );
});

test("phone dialogs clear top safe-area inset", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(
    phone,
    /dialog\s*\{[\s\S]*?padding:\s*max\(20px,\s*env\(safe-area-inset-top\)\)\s+max\(16px,\s*env\(safe-area-inset-right\)\)\s+max\(20px,\s*env\(safe-area-inset-bottom\)\)\s+max\(16px,\s*env\(safe-area-inset-left\)\)/,
  );
});

test("skip link clears top and left safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.skip-link\s*\{\s*position:\s*absolute;\s*left:\s*max\(12px,\s*env\(safe-area-inset-left\)\);\s*top:\s*max\(12px,\s*env\(safe-area-inset-top\)\)/,
  );
});

test("phone conversation menu panel clears bottom safe-area", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(
    phone,
    /\.menu-panel\s*\{[\s\S]*?max-height:\s*calc\(\s*var\(--viewport-height,\s*100dvh\)\s*-\s*72px\s*-\s*env\(safe-area-inset-bottom\)\s*\)/,
  );
});

test("picker panel clears phone safe-area insets", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.picker-panel\s*\{[\s\S]*?width:\s*min\(\s*360px,\s*calc\(100vw\s*-\s*32px\s*-\s*env\(safe-area-inset-left\)\s*-\s*env\(safe-area-inset-right\)\)\s*\)/,
  );
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(
    phone,
    /\.picker-panel\s*\{[\s\S]*?max-height:\s*calc\(\s*var\(--viewport-height,\s*100dvh\)\s*-\s*120px\s*-\s*env\(safe-area-inset-top\)\s*-\s*env\(safe-area-inset-bottom\)\s*\)/,
  );
});

test("phone drawer width clears left safe-area", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  const phone = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(
    phone,
    /#sidebar\s*\{[\s\S]*?width:\s*min\(310px,\s*calc\(85vw\s*-\s*env\(safe-area-inset-left\)\)\)/,
  );
});

test("appearance theme exposes a visible label", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="theme"]');
  assert.ok(label);
  assert.equal(label.classList.contains("sr-only"), false);
  assert.equal(label.textContent.trim(), "Theme");
  assert.equal(
    document.getElementById("theme").getAttribute("aria-label"),
    "Appearance theme",
  );
});

test("history filter exposes a visible label", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="history-filter"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Show");
  assert.equal(
    document.getElementById("history-filter").getAttribute("aria-label"),
    "History filter",
  );
});

test("action row labels use compact muted spacing", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.actions label\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?color:\s*var\(--muted\);[\s\S]*?font-size:\s*13px/,
  );
});

test("settings section labels use compact muted spacing", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.settings-section label\s*\{[\s\S]*?color:\s*var\(--muted\);[\s\S]*?font-size:\s*13px/,
  );
});

test("dialog labels use muted color", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /dialog label\s*\{[\s\S]*?color:\s*var\(--muted\);[\s\S]*?font-size:\s*13px/,
  );
});

test("login labels use muted color", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.login label\s*\{[\s\S]*?color:\s*var\(--muted\);[\s\S]*?font-size:\s*13px/,
  );
});

test("dialog form first labels drop top margin", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /dialog form > label:first-of-type\s*\{[\s\S]*?margin-top:\s*0/);
});

test("repository branch exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="repository-branch"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Branch");
  assert.equal(
    document.getElementById("repository-branch").getAttribute("aria-label"),
    "Repository branch",
  );
});

test("publishing target exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="publishing-target"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Publication");
  assert.equal(
    document.getElementById("publishing-target").getAttribute("aria-label"),
    "Publication target",
  );
});

test("feedback target exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="feedback-target"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Published pull request");
  assert.equal(
    document.getElementById("feedback-target").getAttribute("aria-label"),
    "Published pull request",
  );
});

test("publishing base exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="publishing-base"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "GitHub base branch");
  assert.equal(
    document.getElementById("publishing-base").getAttribute("aria-label"),
    "Publication base branch",
  );
});

test("feedback base exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="feedback-base"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Base branch to integrate");
  assert.equal(
    document.getElementById("feedback-base").getAttribute("aria-label"),
    "Feedback base branch",
  );
});

test("publishing title exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="publishing-title"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Pull request title");
  assert.equal(
    document.getElementById("publishing-title").getAttribute("aria-label"),
    "Pull request title",
  );
});

test("publishing body exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="publishing-body"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Pull request description");
  assert.equal(
    document.getElementById("publishing-body").getAttribute("aria-label"),
    "Pull request description",
  );
});

test("revision prompt exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="revision-prompt"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "What should change?");
  assert.equal(
    document.getElementById("revision-prompt").getAttribute("aria-label"),
    "Revision request",
  );
});

test("repository url exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="repository-url"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Repository URL");
  assert.equal(
    document.getElementById("repository-url").getAttribute("aria-label"),
    "Repository URL",
  );
});

test("repository name exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="repository-name"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Project name");
  assert.equal(
    document.getElementById("repository-name").getAttribute("aria-label"),
    "Import project name",
  );
});

test("project input exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="project-input"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Project name");
  assert.equal(
    document.getElementById("project-input").getAttribute("aria-label"),
    "New project name",
  );
});

test("mode select exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="mode"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Mode");
  assert.equal(
    document.getElementById("mode").getAttribute("aria-label"),
    "Conversation mode",
  );
});

test("adapter select exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="adapter"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Agent");
  assert.equal(document.getElementById("adapter").getAttribute("aria-label"), "Agent");
});

test("access key input exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="key"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Access key");
  assert.equal(document.getElementById("key").getAttribute("aria-label"), "Access key");
});

test("history query exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="history-query"]');
  assert.ok(label);
  assert.equal(
    document.getElementById("history-query").getAttribute("aria-label"),
    "History search",
  );
});

test("prompt exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const label = document.querySelector('label[for="prompt"]');
  assert.ok(label);
  assert.equal(label.textContent.trim(), "Message your agent");
  assert.equal(
    document.getElementById("prompt").getAttribute("aria-label"),
    "Message your agent",
  );
});

test("live run output exposes a stable accessible name and announces politely", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "Current run output"/);
  assert.match(source, /aria-label", "Current run output"[\s\S]*?aria-live", "polite"/);
});

test("current access key confirmation exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "New access key"/);
  assert.match(source, /aria-label", "Current access key"/);
});

test("agent settings content exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /settingsContent\.setAttribute\("aria-label", "Agent settings"\)/);
  assert.match(source, /settingsContent\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /aria-label", "Settings scope"/);
  assert.match(source, /aria-label", "Settings agent"/);
});

test("GitHub access ceiling exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "GitHub access ceiling"/);
  assert.match(source, /AgentD access ceiling/);
});

test("saved access key confirmation exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "I saved the new access key securely"/);
});

test("project name eyebrow exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("project-name").getAttribute("aria-label"),
    "Active project",
  );
  assert.equal(
    document.getElementById("thread-title").getAttribute("aria-describedby"),
    "project-name",
  );
});

test("answer copy code control exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "Copy code"/);
  assert.match(source, /copy\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /copy\.textContent = "Copied"/);
});

test("remaining allowance progress exposes a stable accessible name", () => {
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", label \+ " remaining allowance"/);
});

test("dynamic field labels use muted dialog-label styling", () => {
  const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(css, /\.field-label \{[\s\S]*color: var\(--muted\)/);
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /field-label/);
});

test("feedback comment checkboxes expose stable accessible names", () => {
  const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "Select " \+ item\.key/);
});

test("login blurb exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("login-blurb").getAttribute("aria-label"),
    "Sign-in guidance",
  );
  assert.equal(
    document.getElementById("loginform").getAttribute("aria-describedby"),
    "login-blurb",
  );
});

test("review diff lines expose Added or Removed accessible names", () => {
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(
    source,
    /aria-label", \(added \? "Added: " : "Removed: "\) \+ line\.slice\(1\)/,
  );
});

test("empty list copy exposes stable accessible names", () => {
  const source = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(source, /aria-label", "Empty conversations"/);
  assert.match(source, /aria-label", "Empty projects"/);
});

test("conversation title exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  assert.equal(
    document.getElementById("thread-title").getAttribute("aria-label"),
    "Conversation title",
  );
  assert.equal(
    document.getElementById("thread-title").getAttribute("aria-describedby"),
    "project-name",
  );
});

test("conversation identity group exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const group = document.querySelector(".conversation-heading");
  assert.equal(group.getAttribute("role"), "group");
  assert.equal(group.getAttribute("aria-label"), "Conversation identity");
});

test("composer tools group exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const group = document.querySelector("#compose .tools");
  assert.equal(group.getAttribute("role"), "group");
  assert.equal(group.getAttribute("aria-label"), "Composer tools");
});

test("composer actions group exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const group = document.querySelector(".compose-foot");
  assert.equal(group.getAttribute("role"), "group");
  assert.equal(group.getAttribute("aria-label"), "Composer actions");
});

test("conversation actions menu panel exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const panel = document.querySelector("#conversation-menu .menu-panel");
  assert.equal(panel.getAttribute("role"), "group");
  assert.equal(panel.getAttribute("aria-label"), "Conversation actions");
});

test("agent picker panel exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const panel = document.querySelector(".picker-panel");
  assert.equal(panel.getAttribute("role"), "group");
  assert.equal(panel.getAttribute("aria-label"), "Agent mode and model");
});

test("sidebar brand header exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector(".sidebar-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Workspace brand");
});

test("image attachment wrap exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const wrap = document.querySelector(".attach-wrap");
  assert.equal(wrap.getAttribute("role"), "group");
  assert.equal(wrap.getAttribute("aria-label"), "Image attachment");
});

test("model and effort row exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const row = document.querySelector(".picker-model");
  assert.equal(row.getAttribute("role"), "group");
  assert.equal(row.getAttribute("aria-label"), "Model and effort");
});

test("projects section heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const section = document.querySelector('.section-label[aria-label="Projects section"]');
  assert.equal(section.getAttribute("role"), "group");
  assert.equal(section.getAttribute("aria-label"), "Projects section");
});

test("conversations section heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const section = document.querySelector(
    '.section-label[aria-label="Conversations section"]',
  );
  assert.equal(section.getAttribute("role"), "group");
  assert.equal(section.getAttribute("aria-label"), "Conversations section");
});

test("review dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#review-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Review heading");
});

test("history dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#history-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "History heading");
});

test("settings dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#preferences-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Settings heading");
});

test("activity dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#operations-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Activity heading");
});

test("project settings dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#project-settings-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Project settings heading");
});

test("GitHub connection dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#github-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "GitHub connection heading");
});

test("repositories dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#repository-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Repositories heading");
});

test("publishing dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#publishing-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Publishing heading");
});

test("GitHub feedback dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#feedback-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "GitHub feedback heading");
});

test("run activity dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#run-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Run activity heading");
});

test("check setup dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#check-setup-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Check setup heading");
});

test("access key dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#access-key-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Access key heading");
});

test("updates dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#updates-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Updates heading");
});
test("configuration dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#configuration-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Configuration heading");
});

test("backups dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#backups-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Backups heading");
});

test("CLI dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#cli-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "CLI heading");
});

test("diagnostics dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector("#diagnostics-dialog .review-head");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Diagnostics heading");
});

test("New project dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.querySelector(
    '#project-dialog [aria-label="New project heading"]',
  );
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "New project heading");
});

test("Request revisions dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.getElementById("revision-heading-group");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Request revisions heading");
});

test("Confirm publication dialog heading exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const head = document.getElementById("publication-confirm-heading-group");
  assert.equal(head.getAttribute("role"), "group");
  assert.equal(head.getAttribute("aria-label"), "Confirm publication heading");
});

test("Create project actions expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const actions = document.querySelector("#project-form .actions");
  assert.equal(actions.getAttribute("role"), "group");
  assert.equal(actions.getAttribute("aria-label"), "Create project actions");
});

test("Request revisions actions expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const actions = document.querySelector("#revision-form .actions");
  assert.equal(actions.getAttribute("role"), "group");
  assert.equal(actions.getAttribute("aria-label"), "Request revisions actions");
});

test("Confirm publication actions expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const actions = document.querySelector("#publication-confirm-form .actions");
  assert.equal(actions.getAttribute("role"), "group");
  assert.equal(actions.getAttribute("aria-label"), "Confirm publication actions");
});

test("History filter actions expose a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const actions = document.querySelector("#history-form .actions");
  assert.equal(actions.getAttribute("role"), "group");
  assert.equal(actions.getAttribute("aria-label"), "History filter actions");
});

test("Sign out settings section exposes a stable accessible name", () => {
  const { document } = parseHTML(
    readFileSync(new URL("../public/index.html", import.meta.url), "utf8"),
  );
  const section = document.querySelector("#logout").closest(".settings-section");
  assert.equal(section.getAttribute("aria-label"), "Sign out");
});

test("account dialog heading group is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /accountHead\.setAttribute\("role", "group"\)/);
  assert.match(src, /accountHead\.setAttribute\("aria-label", "Account heading"\)/);
});

test("Agent settings dialog heading group is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /settingsHead\.setAttribute\("role", "group"\)/);
  assert.match(
    src,
    /settingsHead\.setAttribute\("aria-label", "Agent settings heading"\)/,
  );
});

test("account dialog content is named and announces politely in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /accountContent\.setAttribute\("aria-label", "Account connection"\)/);
  assert.match(src, /accountContent\.setAttribute\("aria-live", "polite"\)/);
});

test("Agent settings form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /settingsForm\.setAttribute\("aria-label", "Agent settings form"\)/);
});

test("Agent settings close control is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /settingsClose\.setAttribute\("aria-label", "Close agent settings"\)/,
  );
});

test("storage cleanup preview is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /details\.setAttribute\("aria-label", "Storage cleanup preview"\)/);
});

test("update preview is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /details\.setAttribute\("aria-label", "Update preview"\)/);
});

test("rollback preview is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /details\.setAttribute\("aria-label", "Rollback preview"\)/);
});

test("turn actions are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /actions\.setAttribute\("aria-label", "Turn actions"\)/);
});

test("turn history navigation is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /pages\.setAttribute\("aria-label", "Turn history navigation"\)/);
});

test("history result actions are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /actions\.setAttribute\("aria-label", "History result actions"\)/);
});

test("adapter account actions are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /actions\.setAttribute\("aria-label", "Adapter account actions"\)/);
});

test("activity summary is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /summary\.setAttribute\("aria-label", "Activity summary"\)/);
});

test("activity service is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /service\.setAttribute\("aria-label", "Activity service"\)/);
});

test("activity storage is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /storage\.setAttribute\("aria-label", "Activity storage"\)/);
});

test("activity agent accounts are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /agents\.setAttribute\("aria-label", "Activity agent accounts"\)/);
});

test("activity work lists are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /section\.setAttribute\("aria-label", title\)/);
  assert.match(src, /\["Current work", current,/);
});

test("run history disclosure is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /meta\.setAttribute\("aria-label", "Run history"\)/);
});

test("review checks are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /checksBox\.setAttribute\("aria-label", "Review checks"\)/);
});

test("large review files are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /files\.setAttribute\("aria-label", "Large review files"\)/);
});

test("paginated review controls are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /panel\.setAttribute\("aria-label", "Paginated review"\)/);
  assert.match(
    src,
    /controls\.setAttribute\("aria-label", "Paginated review controls"\)/,
  );
});

test("managed status is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /overview\.setAttribute\("aria-label", "Managed status"\)/);
});

test("tls certificate is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /tls\.setAttribute\("aria-label", "TLS certificate"\)/);
});

test("agent adapters are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /policySection\.setAttribute\("aria-label", "Agent adapters"\)/);
});

test("configuration guidance is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /guidance\.setAttribute\("aria-label", "Where to change things"\)/);
});

test("runtime flags are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /runtimeSection\.setAttribute\("aria-label", "Runtime flags"\)/);
});

test("signed-in origin is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /originSection\.setAttribute\("aria-label", "Signed-in origin"\)/);
});

test("mobile notifications are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /notificationsSection\.setAttribute\("aria-label", "Mobile notifications"\)/,
  );
});

test("configuration github connection is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /githubSection\.setAttribute\("aria-label", "Configuration GitHub connection"\)/,
  );
});

test("agent settings technical disclosure is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /technical\.setAttribute\("aria-label", "How defaults and permissions work"\)/,
  );
});

test("diagnostics services are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /services\.setAttribute\("aria-label", "Diagnostics services"\)/);
});

test("restart services are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /restartSection\.setAttribute\("aria-label", "Restart services"\)/);
});

test("recent failed runs are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /failures\.setAttribute\("aria-label", "Recent failed runs"\)/);
});

test("installed vs tested is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /list\.setAttribute\("aria-label", "Installed vs tested"\)/);
});

test("approved CLI packages are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /approvedSection\.setAttribute\("aria-label", "Approved CLI packages"\)/,
  );
});

test("guided CLI update is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /guide\.setAttribute\("aria-label", "Guided CLI update"\)/);
});

test("updates roll back is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /back\.setAttribute\("aria-label", "Roll back"\)/);
});

test("available update cards are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /card\.setAttribute\("aria-label", `Available update AgentD \$\{release\.version\}`\)/,
  );
});

test("execution details are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /details\.setAttribute\("aria-label", "Execution details"\)/);
});

test("publication commit disclosures are named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /"Publication commit " \+ commit\.sha\.slice\(0, 12\)/);
});

test("set signed-in origin section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /section\.setAttribute\("aria-label", "Set signed-in origin"\)/);
});

test("set ntfy destination section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /section\.setAttribute\("aria-label", "Set ntfy destination"\)/);
});

test("replace managed TLS certificate section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /section\.setAttribute\("aria-label", "Replace managed TLS certificate"\)/,
  );
});

test("managed runtime flags form section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /section\.setAttribute\("aria-label", "Managed runtime flags"\)/);
});

test("enabled adapters section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /enabledSection\.setAttribute\("aria-label", "Enabled adapters"\)/);
});

test("edit permissions section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /editSection\.setAttribute\("aria-label", "Edit permissions"\)/);
});

test("update backups section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /list\.setAttribute\("aria-label", "Update backups"\)/);
});

test("profile enable section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /section\.setAttribute\("aria-label", "Enable " \+ label\)/);
});

test("diagnostics service restart form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Restart " \+ label\)/);
});

test("configuration service restart form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Configuration restart " \+ label\)/,
  );
});

test("backup cleanup form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Backup cleanup"\)/);
});

test("backup restore form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Backup restore"\)/);
});

test("clear ntfy destination form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Clear ntfy destination"\)/);
});

test("pause ntfy notifications form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\(\s*"aria-label",\s*pause \? "Pause ntfy notifications" : "Resume ntfy notifications",\s*\)/,
  );
});

test("CLI install form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "CLI install " \+ label\)/);
});

test("change access key form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Change access key"\)/);
});

test("delete access-key recovery form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Delete access-key recovery file"\)/,
  );
});

test("CLI install approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "CLI install approval " \+ title\)/,
  );
});

test("Save notification settings form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Save notification settings"\)/);
});

test("Backup cleanup approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Backup cleanup approval"\)/);
});

test("Replace TLS certificate approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Replace TLS certificate approval"\)/,
  );
});

test("Adapter policy approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Adapter policy approval"\)/);
});

test("Signed-in origin approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Signed-in origin approval"\)/);
});

test("Confirm access key change form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Confirm access key change"\)/);
});

test("Confirm delete access-key recovery form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Confirm delete access-key recovery file"\)/,
  );
});

test("Enable profile approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Enable profile approval"\)/);
});

test("Apply runtime flags approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Apply runtime flags approval"\)/);
});

test("Configuration restart approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Configuration restart approval " \+ label\)/,
  );
});

test("Backup restore approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Backup restore approval"\)/);
});

test("Diagnostics restart approval form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Restart approval " \+ label\)/);
});

test("Complete account sign-in form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Complete account sign-in"\)/);
});

test("Set signed-in origin form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Set signed-in origin form"\)/);
});

test("Set ntfy destination form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Set ntfy destination form"\)/);
});

test("Replace managed TLS certificate form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /form\.setAttribute\("aria-label", "Replace managed TLS certificate form"\)/,
  );
});

test("Managed runtime flags form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Managed runtime flags form"\)/);
});

test("Adapter policy form is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /form\.setAttribute\("aria-label", "Adapter policy form"\)/);
});

test("Repository job section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /item\.setAttribute\("aria-label", "Repository job " \+ job\.kind \+ " " \+ job\.state\)/,
  );
});

test("repository job section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /item\.setAttribute\("aria-label", "Repository job " \+ job\.kind \+ " " \+ job\.state\)/,
  );
});

test("check setup job section is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /item\.setAttribute\("aria-label", "Check setup " \+ job\.state\)/);
});

test("Feedback item card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /card\.setAttribute\("aria-label", "Feedback item " \+ item\.key\)/);
});

test("large review coverage progress is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /progress\.setAttribute\("aria-label", "Large review coverage"\)/);
});

test("large review coverage progress announces politely in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /progress\.setAttribute\("aria-live", "polite"\)/);
});

test("large review file row is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /row\.setAttribute\("aria-label", "Review file " \+ file\)/);
});

test("Large review file row is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /row\.setAttribute\("aria-label", "Review file " \+ file\)/);
});

test("Activity metric card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /card\.setAttribute\("aria-label", label\)/);
});

test("Update backup card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /card\.setAttribute\("aria-label", "Update backup " \+ item\.version\)/,
  );
});

test("Installed CLI card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /card\.setAttribute\("aria-label", "Installed CLI " \+ title\)/);
});

test("Approved CLI package row is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /row\.setAttribute\("aria-label", "Approved CLI package " \+ title\)/,
  );
});

test("Activity task card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /card\.setAttribute\("aria-label", "Activity task " \+ item\.conversationTitle\)/,
  );
});

test("Activity agent account card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /card\.setAttribute\("aria-label", "Agent account " \+ value\.name\)/,
  );
});

test("Conversation turn is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /turn\.setAttribute\("aria-label", "Conversation turn"\)/);
});

test("History result card is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /card\.setAttribute\("aria-label", "History result " \+ item\.title\)/,
  );
});

test("Run timeline is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /timeline\.setAttribute\("aria-label", "Run timeline"\)/);
});

test("User message is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /user\.setAttribute\("aria-label", "Your message"\)/);
});

test("Agent message is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /response\.setAttribute\("aria-label", "Agent message"\)/);
});

test("Activity task heading is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /head\.setAttribute\("aria-label", "Activity task heading"\)/);
});

test("Turn message heading is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /head\.setAttribute\("aria-label", "Turn message heading"\)/);
});

test("Storage cleanup dialog is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /dialog\.setAttribute\("aria-label", "Review storage cleanup"\)/);
});

test("Turn status live region is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /status\.setAttribute\("aria-live", "polite"\)/);
});

test("Turn status is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /status\.setAttribute\("aria-label", "Turn status"\)/);
});

test("Latest run output is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /outputPre\.setAttribute\("aria-label", "Latest run output"\)/);
});

test("Review checks output is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /checksOutput\.setAttribute\("aria-label", "Review checks output"\)/);
});

test("GitHub device code is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /deviceCode\.setAttribute\("aria-label", "GitHub device code"\)/);
});

test("Check setup script is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /scriptPre\.setAttribute\("aria-label", "Check script " \+ name\)/);
});

test("Paginated review diff is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /diffPre\.setAttribute\("aria-label", "Paginated review diff"\)/);
});

test("Feedback comment body is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /commentBody\.setAttribute\("aria-label", "Feedback comment body"\)/);
});

test("Feedback plan summary is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /planSummary\.setAttribute\("aria-label", "Feedback plan summary"\)/);
});

test("Publication commit patch is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(
    src,
    /commitPatch\.setAttribute\("aria-label", "Publication commit patch"\)/,
  );
});

test("Publication description is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /pubBody\.setAttribute\("aria-label", "Publication description"\)/);
});

test("Update progress live region is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /status\.setAttribute\("aria-live", "polite"\)/);
});

test("Update progress is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /status\.setAttribute\("aria-label", "Update progress"\)/);
});

test("File review box is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /box\.setAttribute\("aria-label", "File review"\)/);
});

test("File review diff is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /pre\.setAttribute\("aria-label", "Diff for " \+ file\.name\)/);
});

test("File review disclosure is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(
    src,
    /details\.setAttribute\("aria-label", "Review file " \+ file\.name\)/,
  );
});

test("File review summary is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(
    src,
    /summary\.setAttribute\("aria-label", "File summary " \+ file\.name\)/,
  );
});

test("Agent answer is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /box\.setAttribute\("aria-label", "Agent answer"\)/);
});

test("Code block is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /wrap\.setAttribute\(\s*"aria-label",\s*"Code block"/);
});

test("Code pre is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /pre\.setAttribute\(\s*"aria-label",\s*"Code"/);
});

test("Code block toolbar is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /head\.setAttribute\("aria-label", "Code block toolbar"\)/);
});

test("Binary diff notice is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/ui.js", import.meta.url), "utf8");
  assert.match(src, /binary\.setAttribute\("aria-label", "Binary file changed"\)/);
});

test("Checkbox focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /input\[type="checkbox"\]:focus-visible/);
});

test("Dialog muted text weight is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /dialog \.muted \{[\s\S]*?font-weight: 500/);
});

test("Summary focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /summary:focus-visible \{/);
});

test("Output download focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /a\.output-download:focus-visible/);
});

test("File summary focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.file-summary:focus-visible/);
});

test("Code copy focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.code-block button:focus-visible/);
});

test("Drawer open focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#drawer-open:focus-visible/);
});

test("Composer tools focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#compose-tools button:focus-visible/);
});

test("Sidebar nav focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#sidebar button:focus-visible/);
});

test("Sidebar foot focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.sidebar-foot button:focus-visible/);
});

test("Dialog button focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /dialog \.review-head button:focus-visible/);
});

test("Conversation header focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(
    src,
    /#conversation-header button:focus-visible|header\.conversation-head button:focus-visible/,
  );
});

test("Turn actions focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.turn-actions button:focus-visible/);
});

test("Agent picker focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.agent-picker summary:focus-visible/);
});

test("Login control focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#login input:focus-visible/);
});

test("History dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#history-dialog button:focus-visible/);
});

test("Settings dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#settings-dialog button:focus-visible/);
});

test("Activity dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#operations-dialog button:focus-visible/);
});

test("Review dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#review-dialog button:focus-visible/);
});

test("Publishing dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /#publishing-dialog button:focus-visible/);
});

test("Feedback dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#feedback-dialog button:focus-visible/);
});

test("GitHub dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#github-dialog button:focus-visible/);
});

test("Backups dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#backups-dialog button:focus-visible/);
});

test("Updates dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#updates-dialog button:focus-visible/);
});

test("Configuration dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#configuration-dialog button:focus-visible/);
});

test("CLI dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#cli-dialog button:focus-visible/);
});

test("Diagnostics dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#diagnostics-dialog button:focus-visible/);
});

test("Access key dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#access-key-dialog button:focus-visible/);
});

test("Run dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#run-dialog button:focus-visible/);
});

test("Preferences dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#preferences-dialog button:focus-visible/);
});

test("Project settings dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#project-settings-dialog button:focus-visible/);
});

test("New project dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#project-dialog button:focus-visible/);
});

test("Repository dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#repository-dialog button:focus-visible/);
});

test("Check setup dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#check-setup-dialog button:focus-visible/);
});

test("Revision dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#revision-dialog button:focus-visible/);
});

test("Publication confirm dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#publication-confirm-dialog button:focus-visible/);
});

test("Composer controls focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#compose button:focus-visible/);
});

test("Conversation region focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#conversation button:focus-visible/);
});

test("Detail panel focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#detail button:focus-visible/);
});

test("Account dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#account-dialog button:focus-visible/);
});

test("Sidebar links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#sidebar\ a:focus-visible/);
});

test("Desk links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /main\.desk\ a:focus-visible/);
});

test("Dialog links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /dialog\ a:focus-visible/);
});

test("Review progress dialog label is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /review-progress-dialog/);
});

test("Review progress dialog focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#review-progress-dialog button:focus-visible/);
});

test("Projects list focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#projects button:focus-visible/);
});

test("Sign-in links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#login\ a:focus-visible/);
});

test("Conversations list focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#tasks button:focus-visible/);
});

test("Run picker focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#run-picker button:focus-visible/);
});

test("Conversation menu focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#conversation-menu button:focus-visible/);
});

test("Attachments focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#attachments button:focus-visible/);
});

test("Workspace links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#workspace\ a:focus-visible/);
});

test("Page notice focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#notice button:focus-visible/);
});

test("Review progress cancel is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(src, /Cancel change preview/);
});

test("Run options focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#run-options button:focus-visible/);
});

test("Picker mode focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#picker-mode button:focus-visible/);
});

test("Settings accounts focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#settings-accounts button:focus-visible/);
});

test("Settings content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#settings-content button:focus-visible/);
});

test("Composer tool links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#compose\-tools\ a:focus-visible/);
});

test("Review head links focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\.review\-head\ a:focus-visible/);
});

test("Review content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#review-content button:focus-visible/);
});

test("Review actions focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#review-actions button:focus-visible/);
});

test("Activity content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#operations-content button:focus-visible/);
});

test("Run content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#run-content button:focus-visible/);
});

test("GitHub content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#github-content button:focus-visible/);
});

test("Check setup content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#check-setup-content button:focus-visible/);
});

test("Publishing content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#publishing-content button:focus-visible/);
});

test("Feedback content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#feedback-content button:focus-visible/);
});

test("Updates content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#updates-content button:focus-visible/);
});

test("Configuration content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#configuration-content button:focus-visible/);
});

test("Backups content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#backups-content button:focus-visible/);
});

test("CLI content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#cli-content button:focus-visible/);
});

test("Diagnostics content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#diagnostics-content button:focus-visible/);
});

test("Access key content focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#access-key-content button:focus-visible/);
});

test("History form focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#history-form button:focus-visible/);
});

test("Project form focus-visible ring is named in app bootstrap", () => {
  const src = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");
  assert.match(src, /\#project-form button:focus-visible/);
});
