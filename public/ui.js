// Small, bounded Markdown subset. Never interpret provider output as HTML.
export function markdownBlocks(input) {
  const lines = String(input)
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .slice(0, 200000)
    .split("\n");
  const blocks = [];
  let code = null,
    language = "";
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code !== null) {
        blocks.push({ type: "code", text: code.join("\n"), language });
        code = null;
      } else {
        code = [];
        language = line.slice(3).trim().slice(0, 40);
      }
    } else if (code !== null) code.push(line);
    else if (/^#{1,4} /.test(line))
      blocks.push({
        type: "heading",
        level: line.indexOf(" "),
        text: line.slice(line.indexOf(" ") + 1),
      });
    else if (/^\s*[-*] /.test(line))
      blocks.push({ type: "bullet", text: line.replace(/^\s*[-*] /, "") });
    else if (/^\d+\. /.test(line))
      blocks.push({ type: "number", text: line.replace(/^\d+\. /, "") });
    else if (line.startsWith("> ")) blocks.push({ type: "quote", text: line.slice(2) });
    else if (line.trim()) {
      const last = blocks.at(-1);
      if (last?.type === "paragraph") last.text += "\n" + line;
      else blocks.push({ type: "paragraph", text: line });
    } else blocks.push({ type: "space", text: "" });
  }
  if (code !== null) blocks.push({ type: "code", text: code.join("\n"), language });
  return blocks;
}
function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function inline(target, text) {
  // Links/images deliberately remain literal: no untrusted URL is loaded.
  for (const part of text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g)) {
    if (part.startsWith("`") && part.endsWith("`"))
      target.append(el("code", part.slice(1, -1)));
    else if (part.startsWith("**") && part.endsWith("**"))
      target.append(el("strong", part.slice(2, -2)));
    else target.append(document.createTextNode(part));
  }
}
export function renderMarkdown(text) {
  const box = el("div", undefined, "answer");
  let list = null;
  for (const block of markdownBlocks(text)) {
    if (block.type === "space") {
      list = null;
      continue;
    }
    if (block.type === "code") {
      const wrap = el("div", undefined, "code-block"),
        head = el("div", undefined, "code-head"),
        copy = el("button", "Copy code");
      copy.type = "button";
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(block.text);
          copy.textContent = "Copied";
        } catch {
          copy.textContent = "Select code to copy";
        }
      };
      head.append(el("span", block.language || "Code"), copy);
      const pre = el("pre");
      pre.append(el("code", block.text));
      wrap.append(head, pre);
      box.append(wrap);
      list = null;
      continue;
    }
    if (["bullet", "number"].includes(block.type)) {
      const tag = block.type === "bullet" ? "UL" : "OL";
      if (!list || list.tagName !== tag) {
        list = el(tag.toLowerCase());
        box.append(list);
      }
      const item = el("li");
      inline(item, block.text);
      list.append(item);
      continue;
    }
    list = null;
    const n = el(
      block.type === "heading"
        ? "h" + Math.min(4, block.level + 1)
        : block.type === "quote"
          ? "blockquote"
          : "p",
    );
    inline(n, block.text);
    box.append(n);
  }
  return box;
}
// Git patch parser. Header lines (index, ---, +++, mode, rename) only exist between
// "diff --git" and the first "@@" of a file; inside hunks every line is content,
// including removed "-- comment" lines that appear as "--- comment".
const unquote = (path) =>
  path.startsWith('"') && path.endsWith('"')
    ? path.slice(1, -1).replace(/\\(.)/g, "$1")
    : path;
const stripPrefix = (path) => unquote(path).replace(/^[ab]\//, "");
export function diffFiles(patch) {
  const files = [];
  let file = null,
    inHunk = false;
  for (const line of String(patch).slice(0, 180000).split("\n")) {
    if (line.startsWith("diff --git ")) {
      const names = /^diff --git (?:a\/)?(.+?) (?:b\/)?(.+)$/.exec(line);
      file = {
        name: names ? unquote(names[2]) : line.slice(11),
        status: "modified",
        additions: 0,
        deletions: 0,
        binary: false,
        lines: [],
      };
      files.push(file);
      inHunk = false;
      continue;
    }
    if (!file) {
      if (!line) continue;
      file = {
        name: "Changes",
        status: "modified",
        additions: 0,
        deletions: 0,
        binary: false,
        lines: [],
      };
      files.push(file);
    }
    if (line.startsWith("@@")) {
      inHunk = true;
      file.lines.push(line);
      continue;
    }
    if (!inHunk) {
      if (line.startsWith("new file mode")) file.status = "added";
      else if (line.startsWith("deleted file mode")) file.status = "deleted";
      else if (line.startsWith("rename from ")) {
        file.status = "renamed";
        file.from = unquote(line.slice(12));
      } else if (line.startsWith("rename to ")) file.name = unquote(line.slice(10));
      else if (line.startsWith("+++ ") && line !== "+++ /dev/null")
        file.name = stripPrefix(line.slice(4));
      else if (
        line.startsWith("--- ") &&
        file.status === "deleted" &&
        line !== "--- /dev/null"
      )
        file.name = stripPrefix(line.slice(4));
      else if (line.startsWith("Binary files ") || line === "GIT binary patch")
        file.binary = true;
      continue;
    }
    if (line.startsWith("+")) file.additions++;
    else if (line.startsWith("-")) file.deletions++;
    file.lines.push(line);
  }
  // A trailing newline in the patch produces one empty line; it is not content.
  for (const f of files) if (f.lines.at(-1) === "") f.lines.pop();
  return files;
}
export function diffStats(patch) {
  const files = diffFiles(patch);
  return {
    files: files.length,
    additions: files.reduce((n, f) => n + f.additions, 0),
    deletions: files.reduce((n, f) => n + f.deletions, 0),
  };
}
export function renderDiff(patch) {
  const box = el("div", undefined, "file-review");
  for (const file of diffFiles(patch)) {
    const details = el("details"),
      summary = el("summary", undefined, "file-summary");
    details.open = true;
    summary.append(el("span", file.name, "file-name"));
    if (file.status !== "modified")
      summary.append(
        el(
          "span",
          file.status === "added"
            ? "New"
            : file.status === "deleted"
              ? "Deleted"
              : "Renamed from " + file.from,
          "file-status " + file.status,
        ),
      );
    summary.append(el("span", `+${file.additions} −${file.deletions}`, "file-counts"));
    details.append(summary);
    const pre = el("pre", undefined, "diff");
    if (file.binary)
      pre.append(el("span", "Binary file changed. Review it locally.", "diff-line"));
    let old = 0,
      next = 0;
    for (const line of file.lines) {
      const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line);
      if (hunk) {
        old = Number(hunk[1]);
        next = Number(hunk[2]);
        const row = el("span", undefined, "diff-line hunk");
        const gutter = el("span", "\t", "line-number");
        gutter.setAttribute("aria-hidden", "true");
        row.append(gutter, document.createTextNode(line + "\n"));
        pre.append(row);
        continue;
      }
      if (line.startsWith("\\")) {
        pre.append(el("span", line + "\n", "diff-line note"));
        continue;
      }
      const added = line.startsWith("+"),
        removed = line.startsWith("-"),
        context = !added && !removed;
      const row = el(
        "span",
        undefined,
        added ? "diff-line addition" : removed ? "diff-line deletion" : "diff-line",
      );
      const gutter = el(
        "span",
        `${removed || context ? old++ : ""}\t${added || context ? next++ : ""}`,
        "line-number",
      );
      gutter.setAttribute("aria-hidden", "true");
      row.append(gutter, document.createTextNode(line + "\n"));
      if (added || removed)
        row.setAttribute("aria-label", (added ? "Added: " : "Removed: ") + line.slice(1));
      pre.append(row);
    }
    details.append(pre);
    box.append(details);
  }
  return box;
}
/** Compact human duration for active-run status (seconds under 60, then minutes). */
export function formatCompactDuration(seconds) {
  const secs = Math.max(0, Math.floor(Number(seconds) || 0));
  if (secs < 60) return `${secs}s`;
  const minutes = Math.floor(secs / 60);
  const rem = secs % 60;
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Honest active-status wording with elapsed time since the current state began.
 * Prefer task.updated (status transition time); created is a fallback only.
 */
export function formatActiveStatusLabel(status, startedAt, now = Date.now()) {
  const started = Date.parse(startedAt);
  const secs = Number.isFinite(started)
    ? Math.max(0, Math.floor((now - started) / 1000))
    : 0;
  const duration = formatCompactDuration(secs);
  if (status === "waiting_for_approval")
    return `Ready for your approval · waiting ${duration}`;
  if (status === "queued") return `Queued · ${duration}`;
  if (status === "running") return `Working · ${duration}`;
  if (status === "cancelling") return `Stopping · ${duration}`;
  return duration;
}

/**
 * Bounded plain-text preview of live run output for the conversation turn.
 * Strips ANSI, prefers a trailing line boundary, never interprets HTML/Markdown.
 */
export function liveOutputPreview(text, maxChars = 6000) {
  const cleaned = String(text ?? "")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\r/g, "");
  if (!cleaned) return { text: "", truncated: false };
  if (cleaned.length <= maxChars) return { text: cleaned, truncated: false };
  const slice = cleaned.slice(-maxChars);
  const nl = slice.indexOf("\n");
  const body = nl >= 0 && nl < 240 ? slice.slice(nl + 1) : slice;
  return { text: body, truncated: true };
}

/**
 * Composer primary control while a run is active: Stop replaces Send.
 * waiting_for_approval uses Cancel; cancelling shows a disabled Stopping label.
 */
export function composerStopControl(status) {
  if (status === "cancelling")
    return { visible: true, label: "Stopping…", disabled: true, mode: "stopping" };
  if (status === "queued" || status === "running")
    return { visible: true, label: "■ Stop", disabled: false, mode: "stop" };
  if (status === "waiting_for_approval")
    return { visible: true, label: "Cancel", disabled: false, mode: "cancel" };
  return { visible: false, label: "■ Stop", disabled: true, mode: "idle" };
}

export function setupShell() {
  const $ = (id) => document.getElementById(id),
    mobile = matchMedia("(max-width: 760px)");
  const focusables = (root) =>
    [
      ...root.querySelectorAll(
        "button:not(:disabled),a[href],input:not(:disabled),select,textarea,summary",
      ),
    ].filter((e) => e.getClientRects().length);
  function drawer(open) {
    $("sidebar").classList.toggle("open", open);
    $("drawer-backdrop").hidden = !open;
    $("drawer-open").setAttribute("aria-expanded", String(open));
    document.querySelector(".desk").inert = open && mobile.matches;
    $("sidebar").inert = mobile.matches && !open;
    if (open) $("drawer-close").focus();
    else if (mobile.matches) $("drawer-open").focus();
  }
  $("drawer-open").onclick = () => drawer(true);
  $("drawer-close").onclick = $("drawer-backdrop").onclick = () => drawer(false);
  $("sidebar").addEventListener("keydown", (e) => {
    if (!mobile.matches || !$("sidebar").classList.contains("open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      drawer(false);
    }
    if (e.key === "Tab") {
      const items = focusables($("sidebar")),
        first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  $("sidebar").addEventListener("click", (e) => {
    if (!mobile.matches || !e.target.closest("button")) return;
    if (e.target.closest("#drawer-close")) return;
    drawer(false);
  });
  mobile.addEventListener("change", () => drawer(false));
  drawer(false);
  $("preferences-menu").onclick = () => $("preferences-dialog").showModal();
  $("preferences-close").onclick = () => $("preferences-dialog").close();
  const appearance = $("theme");
  try {
    appearance.value = localStorage.getItem("agentd-theme") || "system";
  } catch {}
  const theme = () => {
    document.documentElement.dataset.theme = appearance.value;
    try {
      localStorage.setItem("agentd-theme", appearance.value);
    } catch {}
  };
  appearance.onchange = theme;
  theme();
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#conversation-menu")) $("conversation-menu").open = false;
    else if (e.target.closest("button")) $("conversation-menu").open = false;
    if (!e.target.closest("#run-picker")) $("run-picker").open = false;
    else if (e.target.closest("#run-options")) $("run-picker").open = false;
  });
  // Native dialogs supply modality and focus restoration. Give dynamic dialogs names too.
  const nameDialogs = () => {
    for (const dialog of document.querySelectorAll("dialog")) {
      const heading = dialog.querySelector("h2");
      if (heading && !dialog.hasAttribute("aria-labelledby")) {
        heading.id ||= dialog.id + "-title";
        dialog.setAttribute("aria-labelledby", heading.id);
      }
      if (!dialog.dataset.observed) {
        dialog.dataset.observed = "yes";
        dialog.addEventListener("close", () =>
          dialog.querySelector(".dialog-notice")?.remove(),
        );
      }
    }
  };
  nameDialogs();
  new MutationObserver(nameDialogs).observe(document.body, { childList: true });
  const elapsed = () => {
    for (const p of document.querySelectorAll("[data-started]")) {
      p.textContent = formatActiveStatusLabel(p.dataset.state, p.dataset.started);
    }
  };
  elapsed();
  setInterval(elapsed, 1000);
  // Keep the composer above the on-screen keyboard without scrolling the entire app.
  const viewport = () => {
    document.documentElement.style.setProperty(
      "--viewport-height",
      (window.visualViewport?.height ?? innerHeight) + "px",
    );
  };
  window.visualViewport?.addEventListener("resize", viewport);
  window.addEventListener("resize", viewport);
  viewport();
}

/** Provider percentages are account quotas, not token-cost estimates or model prices. */
export function renderUsage(id, usage = {}) {
  const section = document.createElement("section");
  section.className = "provider-usage";
  const add = (tag, text, cls) => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    section.append(el);
    return el;
  };
  add("h4", "Credits and usage");
  const fresh = usage.state === "available";
  add("p", usage.message || "Usage is unavailable.", fresh ? "muted" : "attention");
  for (const w of usage.windows ?? []) {
    const minutes = w.durationMins;
    const period =
      minutes && minutes % 1440 === 0
        ? minutes / 1440 + " day"
        : minutes && minutes % 60 === 0
          ? minutes / 60 + " hour"
          : minutes
            ? minutes + " minute"
            : w.period;
    const label = w.bucket + " · " + period + " window";
    add(
      "p",
      label +
        ": " +
        Math.round(w.remainingPercent * 10) / 10 +
        "% remaining" +
        (fresh ? "" : " (last known)"),
    );
    const bar = add("progress", "");
    bar.max = 100;
    bar.value = w.remainingPercent;
    bar.setAttribute("aria-label", label + " remaining allowance");
    if (w.resetsAt)
      add("p", "Provider reset time: " + new Date(w.resetsAt).toLocaleString(), "muted");
    if (fresh && w.remainingPercent <= 10)
      add(
        "p",
        w.remainingPercent === 0
          ? "This usage window is exhausted. Check provider limits before starting more work."
          : "This usage window is nearly exhausted.",
        "attention",
      );
  }
  for (const c of usage.credits ?? [])
    add(
      "p",
      c.bucket +
        " credits: " +
        (c.unlimited === true
          ? "unlimited reported by provider"
          : c.balance !== null
            ? c.balance + " provider credits"
            : c.hasCredits === false
              ? "none available"
              : "balance unavailable") +
        (fresh ? "" : " (last known)"),
    );
  if (usage.resetCredits !== null && usage.resetCredits !== undefined)
    add(
      "p",
      "Available rate-limit resets: " +
        usage.resetCredits +
        (fresh ? "" : " (last known)"),
    );
  if (usage.checkedAt)
    add("p", "Checked " + new Date(usage.checkedAt).toLocaleString(), "muted");
  const urls = {
    codex: "https://chatgpt.com/codex/settings/usage",
    claude: "https://claude.ai/settings/usage",
    cursor: "https://cursor.com/dashboard",
  };
  if (urls[id]) {
    const a = add("a", "Open provider usage page");
    a.href = urls[id];
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return section;
}
