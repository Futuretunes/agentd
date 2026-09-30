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
    "project-heading",
    "label",
    "project-input",
    "p",
  ]);
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
