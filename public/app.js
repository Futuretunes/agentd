import { renderMarkdown, renderDiff, diffStats, setupShell } from "./ui.js";
const $ = (id) => document.getElementById(id);
let nextRun = {},
  composerPolicy = null;
const composerKey = () => projectId + ":" + selected + ":" + $("adapter").value;
let projectId = null,
  selected = null,
  uploads = [],
  signedIn = false,
  busy = false,
  generation = 0;
let policy = { editAdapters: [], enabledAdapters: ["codex", "claude"] };
const modeNames = { ask: "Ask", chat: "Chat only", edit: "Edit" };
// One composer control shows the agent, requested model and mode for the next run.
function renderPicker() {
  const agent = policy.adapters?.find((a) => a.id === $("adapter").value);
  const model = $("selection-summary").dataset.model;
  $("picker-summary").textContent =
    (agent?.name ?? "No agent") + (model ? " · " + model : "");
  $("picker-mode").textContent = modeNames[$("mode").value] ?? "Ask";
  const reasons = (policy.adapters ?? [])
    .filter((a) => !a.available)
    .map(
      (a) =>
        a.name +
        ": " +
        ({
          "Adapter disabled by security policy": "not enabled on this server",
          "CLI is missing or not executable": "not installed",
        }[a.reason] ??
          a.reason ??
          "unavailable"),
    );
  if (agent?.id === "cursor")
    reasons.push("Cursor accepts text only; images are unavailable.");
  $("agent-reasons").textContent = reasons.join(" · ");
  $("agent-reasons").hidden = !reasons.length;
}
function applyPolicy() {
  if (policy.adapters) {
    const signature = JSON.stringify(
      policy.adapters.map((value) => [value.id, value.name]),
    );
    if ($("adapter").dataset.options !== signature) {
      const selected = $("adapter").value;
      $("adapter").replaceChildren(
        ...policy.adapters.map((value) => {
          const option = node("option", value.name);
          option.value = value.id;
          return option;
        }),
      );
      $("adapter").value = selected;
      $("adapter").dataset.options = signature;
    }
  }
  for (const option of $("adapter").options)
    option.disabled = !policy.enabledAdapters.includes(option.value);
  if (!policy.enabledAdapters.includes($("adapter").value))
    $("adapter").value = policy.enabledAdapters[0] ?? "";
  const modes =
    composerPolicy?.key === composerKey()
      ? composerPolicy.allowedModes
      : (policy.adapters?.find((a) => a.id === $("adapter").value)?.modes ?? [
          "ask",
        ]);
  for (const option of $("mode").options)
    option.disabled = !modes.includes(option.value);
  if (!modes.includes($("mode").value)) $("mode").value = modes[0] ?? "ask";
  const chat = $("mode").value === "chat",
    textOnly =
      chat ||
      policy.adapters?.find((a) => a.id === $("adapter").value)?.features
        ?.images === false;
  $("files").disabled = textOnly || submitting;
  $("files").closest("label").hidden = textOnly;
  $("mode").title = chat
    ? "Text conversation only. No project files, terminal, editing, web browsing or plugins."
    : "";
  $("policy-hint").textContent = !policy.enabledAdapters.length
    ? "No agents are available. Open Settings for details."
    : chat
      ? "Chat only · text you send and prior conversation context · no project access or execution tools."
      : policy.strictWorkers
        ? "Isolated workers · provider-only network access · approval required."
        : "Each message waits for approval before an agent starts.";
  renderPicker();
}
$("adapter").onchange = $("mode").onchange = () => {
  applyPolicy();
  saveDraft();
  if (!selected) fingerprint = "";
  void refresh();
};
let reviewTask = null,
  reviewTree = null,
  checking = false;
let pageBefore = null,
  archivedView = false,
  submitting = false;
try {
  const location = JSON.parse(
    sessionStorage.getItem("agentd-draft-v1:location") ?? "null",
  );
  if (location) {
    projectId = location.project;
    selected = location.conversation;
  }
} catch {}
let projects = [],
  latest = null,
  fingerprint = "",
  uploading = false,
  operationsBusy = false;
const draftPrefix = "agentd-draft-v1:";
let draftLocation = null;
function draftKey() {
  return projectId ? draftPrefix + projectId + ":" + (selected ?? "new") : null;
}
function saveDraft() {
  if (!signedIn || !draftLocation) return;
  try {
    const value = {
      text: $("prompt").value,
      uploads,
      adapter: $("adapter").value,
      mode: $("mode").value,
      nextRun,
    };
    if (value.text || value.uploads.length || Object.keys(nextRun).length)
      sessionStorage.setItem(draftLocation, JSON.stringify(value));
    else sessionStorage.removeItem(draftLocation);
    $("draft-hint").textContent =
      value.text || value.uploads.length
        ? "Draft saved in this browser tab. Cleared when you sign out."
        : "";
  } catch {
    $("draft-hint").textContent =
      "Draft could not be saved in this browser. Keep this page open.";
  }
}
function restoreDraft() {
  if (!signedIn) {
    draftLocation = null;
    return;
  }
  try {
    if (projectId)
      sessionStorage.setItem(
        draftPrefix + "location",
        JSON.stringify({ project: projectId, conversation: selected }),
      );
  } catch {}
  nextRun = {};
  draftLocation = draftKey();
  if (!signedIn || !draftLocation) return;
  try {
    const value = JSON.parse(sessionStorage.getItem(draftLocation) ?? "null");
    if (value && typeof value.text === "string") {
      $("prompt").value = value.text.slice(0, 16000);
      uploads = Array.isArray(value.uploads) ? value.uploads.slice(0, 4) : [];
      $("adapter").value = value.adapter;
      $("mode").value = value.mode;
      nextRun = value.nextRun ?? {};
      applyPolicy();
      renderUploads();
      $("draft-hint").textContent = "Draft restored from this browser tab.";
    } else $("draft-hint").textContent = "";
  } catch {
    $("draft-hint").textContent = "";
  }
}
function forgetDraft(key) {
  try {
    if (key) sessionStorage.removeItem(key);
  } catch {}
}
function clearDrafts() {
  if ($("github-content")) $("github-content").replaceChildren();
  for (const dialog of document.querySelectorAll("dialog[open]"))
    dialog.close();
  draftLocation = null;
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith(draftPrefix)) sessionStorage.removeItem(key);
  } catch {}
  $("prompt").value = "";
  uploads = [];
  nextRun = {};
  $("draft-hint").textContent = "";
}
$("prompt").addEventListener("input", saveDraft);
window.addEventListener("pagehide", saveDraft);
const labels = {
  waiting_for_approval: "Ready for your approval",
  queued: "Queued",
  running: "Working",
  cancelling: "Stopping",
  cancelled: "Cancelled",
  succeeded: "Finished",
  failed: "Failed",
  interrupted: "Interrupted",
  timed_out: "Time limit reached",
};
const pending = (status) =>
  ["waiting_for_approval", "queued", "running", "cancelling"].includes(status);
function notice(text = "") {
  const dialogs = [...document.querySelectorAll("dialog[open]")];
  const active = dialogs.at(-1);
  let target = $("notice");
  if (active) {
    target = active.querySelector(".dialog-notice");
    if (!target) {
      target = node("p", "", "dialog-notice error");
      target.setAttribute("role", "alert");
      active.append(target);
    }
  }
  target.textContent = text;
  target.hidden = !text;
  if (active && text) target.scrollIntoView({ block: "nearest" });
}

function node(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
async function api(path, data) {
  const res = await fetch(path, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const value = await res.json();
  if (res.status === 401) {
    clearDrafts();
    signedIn = false;
    for (const dialog of document.querySelectorAll("dialog[open]"))
      dialog.close();
    if ($("account-content")) $("account-content").replaceChildren();
    $("workspace").hidden = true;
    $("login").hidden = false;
  }
  if (!res.ok) throw Error(value.error ?? "Request failed");
  return value;
}
function button(text, callback, cls = "") {
  const b = node("button", text, cls);
  b.type = "button";
  b.onclick = async () => {
    b.disabled = true;
    try {
      await callback();
      await refresh();
    } catch (e) {
      notice(e.message);
    } finally {
      b.disabled = false;
    }
  };
  return b;
}
const relativeTime = (value) => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
};
function operationTask(item) {
  const card = node("article", undefined, "operation-task"),
    head = node("div", undefined, "message-head");
  head.append(
    node("strong", item.conversationTitle),
    node("span", labels[item.status] ?? item.status, "status " + item.status),
  );
  card.append(
    head,
    node(
      "p",
      `${item.projectName} · ${item.adapter === "cursor" ? "Cursor" : item.adapter === "codex" ? "Codex" : "Claude"} · ${item.mode === "edit" ? "Edit files" : item.mode === "chat" ? "Chat only" : "Ask"} · ${relativeTime(item.updated)}`,
      "muted",
    ),
  );
  if (item.error)
    card.append(
      node(
        "p",
        item.error === "Exit 1"
          ? "The agent stopped with an error. Open the conversation for details."
          : item.error,
        "error",
      ),
    );
  if (item.review === "pending")
    card.append(node("p", "Changes are waiting for review.", "attention"));
  if (item.checkStatus)
    card.append(node("p", "Checks: " + item.checkStatus, "muted"));
  card.append(
    button(
      ["failed", "timed_out", "interrupted", "cancelled"].includes(item.status)
        ? "Open & recover"
        : "Open conversation",
      async () => {
        saveDraft();
        projectId = item.project;
        reset(item.conversation);
        $("operations-dialog").close();
        await refresh();
      },
    ),
  );
  return card;
}
function accountsSection(data) {
  const agents = node("div");
  for (const value of data.adapters) {
    const card = node("div", undefined, "operation-agent"),
      account = value.account ?? {
        state: "checking",
        message: "Checking account status",
      };
    const plainReason = {
      "Adapter disabled by security policy":
        "Not enabled for runs on this server",
      "CLI is missing or not executable": "Not installed on this server",
    };
    card.append(
      node("strong", value.name),
      node(
        "p",
        account.state === "signed_in"
          ? `Signed in${account.method ? " · " + account.method : ""}`
          : account.state === "unavailable"
            ? ""
            : account.message,
        account.state === "signed_in"
          ? "good"
          : account.state === "signed_out"
            ? "attention"
            : "muted",
      ),
      node(
        "p",
        value.available
          ? "Available · " +
              value.modes
                .map((mode) =>
                  mode === "edit"
                    ? "Edit files"
                    : mode === "chat"
                      ? "Chat only"
                      : "Ask",
                )
                .join(" and ")
          : (plainReason[value.reason] ?? value.reason),
        "muted",
      ),
    );
    const actions = node("div", undefined, "actions");
    if (value.id === "cursor" && value.installed)
      card.append(
        node(
          "p",
          "Uses your Cursor account. Your plan and on-demand billing settings apply; agentd cannot verify remaining allowance.",
          "muted",
        ),
      );
    if (value.renewal)
      card.append(
        node(
          "p",
          value.renewal.message,
          value.renewal.state === "reconnect_required" ? "attention" : "muted",
        ),
      );
    if (value.installed && !value.enabled)
      card.append(
        node(
          "p",
          "Not enabled for runs on this server. You can still sign in ahead of time.",
          "muted",
        ),
      );
    const login = button(
      account.state === "signed_in" ? "Reconnect account" : "Sign in",
      () => startAccount(value.id, "login"),
    );
    login.hidden = !value.installed;
    login.disabled =
      !value.installed ||
      !!data.service.activeTask ||
      data.service.queueDepth > 0 ||
      data.service.accountChange ||
      data.service.renewing;
    actions.append(login);
    if (account.state === "signed_in") {
      const logout = button(
        "Sign out",
        async () => {
          if (
            confirm(
              "Sign out of " +
                value.name +
                " on this server? Future runs will need a new login.",
            )
          )
            await startAccount(value.id, "logout");
        },
        "danger",
      );
      logout.disabled = login.disabled;
      actions.append(logout);
    }
    card.append(actions);
    for (const line of card.querySelectorAll("p"))
      if (!line.textContent) line.remove();
    agents.append(card);
  }
  agents.append(
    node(
      "p",
      "Usage limits are not shown: the native CLIs do not report them reliably.",
      "muted",
    ),
    button("Refresh account status", () =>
      api("/api/account", { action: "refresh" }),
    ),
  );
  if (data.service.renewing)
    agents.append(
      node("p", "Renewing the account before the next approved run.", "muted"),
    );
  if (data.service.accountChange)
    agents.append(
      node(
        "p",
        "An account change is in progress. Work resumes when it finishes.",
        "attention",
      ),
      button("View sign-in", () => showAccount()),
    );
  else if (data.service.activeTask || data.service.queueDepth > 0)
    agents.append(
      node(
        "p",
        "Finish or stop current work before changing accounts.",
        "muted",
      ),
    );
  return agents;
}
function renderOperations(data) {
  const content = $("operations-content");
  content.replaceChildren();
  const active =
      (data.counts.waiting_for_approval ?? 0) +
      (data.counts.queued ?? 0) +
      (data.counts.running ?? 0) +
      (data.counts.cancelling ?? 0),
    problems =
      (data.counts.failed ?? 0) +
      (data.counts.timed_out ?? 0) +
      (data.counts.interrupted ?? 0);
  const summary = node("section", undefined, "operation-summary");
  for (const [value, label] of [
    [active, "Active or waiting"],
    [data.counts.succeeded ?? 0, "Completed"],
    [problems, "Need attention"],
    [data.service.queueDepth, "Queued"],
  ]) {
    const card = node("div", undefined, "metric-card");
    card.append(node("strong", String(value)), node("span", label));
    summary.append(card);
  }
  content.append(summary);
  if (data.service.dependencySetup)
    content.append(
      node(
        "p",
        "Dependencies are being prepared. Task starts wait until preparation finishes.",
        "attention",
      ),
    );
  const service = node("section", undefined, "operation-section");
  service.append(
    node("h3", "Service"),
    node(
      "p",
      `Healthy · ${data.service.scheduler} scheduler · ${data.service.security} workers`,
      "good",
    ),
    node(
      "p",
      data.service.activeTask
        ? "An agent is currently working."
        : "No agent is currently running.",
      "muted",
    ),
  );
  content.append(service);
  if (data.resources) {
    const r = data.resources,
      b = r.service,
      storage = node("section", undefined, "operation-section");
    const bytes = (value) =>
      value >= 1024 ** 3
        ? (value / 1024 ** 3).toFixed(1) + " GiB"
        : (value / 1024 ** 2).toFixed(1) + " MiB";
    storage.append(
      node("h3", "Storage and limits"),
      node(
        "p",
        bytes(r.freeBytes) +
          " free · " +
          bytes(r.limits.reserveBytes) +
          " reserved for recovery",
      ),
      node(
        "p",
        "Output is limited to " +
          bytes(r.limits.logBytes) +
          " per run/check. Worktrees are monitored at " +
          bytes(r.limits.worktreeBytes) +
          ".",
        "muted",
      ),
    );
    storage.append(
      node(
        "p",
        b.available && b.memoryMax && b.tasksMax && b.cpuCores
          ? "Service caps: " +
              bytes(b.memoryMax) +
              " memory · " +
              b.cpuCores +
              " CPU cores · " +
              b.tasksMax +
              " processes/threads"
          : "Service caps are not verified yet. The administrator resource update is still required.",
        "muted",
      ),
    );
    const preview = button("Review storage cleanup", async () => {
      preview.disabled = true;
      try {
        const plan = await api("/api/storage", { action: "preview" });
        const details = node("div");
        details.append(
          node(
            "p",
            plan.items.length +
              " eligible tasks · approximately " +
              bytes(plan.bytes) +
              " reclaimable.",
          ),
        );
        details.append(
          node(
            "p",
            "Only archived conversations with runs older than 30 days qualify. Unresolved or committed edits, failed read-only runs, answers and conversation history are kept. Deleting a discarded worktree is permanent.",
            "muted",
          ),
        );
        for (const item of plan.items)
          details.append(
            node(
              "p",
              item.id.slice(0, 8) +
                " · " +
                (item.worktree ? "worktree and " : "") +
                item.logs +
                " raw logs · " +
                bytes(item.bytes),
            ),
          );
        if (plan.skipped.length)
          details.append(
            node(
              "p",
              plan.skipped.length +
                " tasks need manual review and will be kept.",
            ),
          );
        if (plan.items.length) {
          const approve = button("Approve cleanup", async () => {
            if (
              !confirm(
                "Permanently remove only the worktrees and raw logs in this preview? Saved answers and task history are kept.",
              )
            )
              return;
            approve.disabled = true;
            try {
              const result = await api("/api/storage", {
                action: "cleanup",
                fingerprint: plan.fingerprint,
              });
              notice(
                result.removed.length +
                  " tasks cleaned; " +
                  result.errors.length +
                  " require review.",
              );
              dialog.close();
              await loadOperations(false);
            } catch (e) {
              notice(e.message);
              approve.disabled = false;
            }
          });
          details.append(approve);
        }
        const dialog = node("dialog");
        dialog.append(node("h2", "Review storage cleanup"), details);
        const close = button("Close", () => dialog.close());
        dialog.append(close);
        dialog.addEventListener("close", () => {
          dialog.remove();
          preview.disabled = false;
        });
        document.body.append(dialog);
        dialog.showModal();
      } catch (e) {
        notice(e.message);
        preview.disabled = false;
      }
    });
    storage.append(
      preview,
      node(
        "p",
        "Deployment backups have a separate administrator-only retention policy. Cleanup here cannot access them.",
        "hint",
      ),
    );
    content.append(storage);
  }

  const current = data.tasks.filter(
      (item) => pending(item.status) || item.review === "pending",
    ),
    attention = data.tasks.filter((item) =>
      ["failed", "timed_out", "interrupted"].includes(item.status),
    ),
    recent = data.tasks
      .filter(
        (item) =>
          !pending(item.status) &&
          item.review !== "pending" &&
          !["failed", "timed_out", "interrupted"].includes(item.status),
      )
      .slice(0, 10);
  for (const [title, items, emptyText] of [
    ["Current work", current, "Nothing is waiting or running."],
    ["Needs attention", attention, "No recent failures need attention."],
    ["Recent work", recent, "No completed work yet."],
  ]) {
    const section = node("section", undefined, "operation-section");
    section.append(node("h3", title));
    if (items.length) section.append(...items.map(operationTask));
    else section.append(node("p", emptyText, "muted"));
    content.append(section);
  }
  content.append(
    node(
      "p",
      "Updated " +
        new Date(data.generatedAt).toLocaleTimeString() +
        ". Account status is cached; usage appears only when a native provider exposes it reliably.",
      "hint",
    ),
  );
}
async function loadOperations(show = true) {
  if (operationsBusy) return;
  operationsBusy = true;
  try {
    if (show && !$("operations-dialog").open)
      $("operations-dialog").showModal();
    if (show)
      $("operations-content").replaceChildren(
        node("p", "Loading workspace status…", "muted"),
      );
    renderOperations(await api("/api/operations"));
  } catch (e) {
    notice(e.message);
    // Keep the error inside the active dialog.
  } finally {
    operationsBusy = false;
  }
}
$("operations-menu").onclick = () => loadOperations();
let accountsBusy = false;
async function loadAccounts(show = true) {
  if (accountsBusy) return;
  accountsBusy = true;
  const box = $("settings-accounts");
  try {
    if (show) box.replaceChildren(node("p", "Checking agents…", "muted"));
    box.replaceChildren(accountsSection(await api("/api/operations")));
  } catch (e) {
    box.replaceChildren(node("p", e.message, "error"));
  } finally {
    accountsBusy = false;
  }
}
$("operations-close").onclick = () => $("operations-dialog").close();
const accountDialog = node("dialog");
accountDialog.id = "account-dialog";
accountDialog.setAttribute("aria-labelledby", "account-heading");
const accountHead = node("div", undefined, "review-head"),
  accountHeading = node("h2", "Connect your account");
accountHeading.id = "account-heading";
const accountClose = node("button", "×");
accountClose.type = "button";
accountClose.setAttribute("aria-label", "Close account dialog");
accountClose.onclick = () => {
  accountDialog.close();
  $("account-content").replaceChildren();
};
accountHead.append(accountHeading, accountClose);
const accountContent = node("div");
accountContent.id = "account-content";
accountDialog.append(accountHead, accountContent);
document.body.append(accountDialog);
let accountFingerprint = "",
  accountPolling = false;
accountDialog.addEventListener("close", () => {
  accountContent.replaceChildren();
  accountFingerprint = "";
});
async function startAccount(adapter, operation) {
  await api("/api/account", { action: "start", adapter, operation });
  await showAccount();
}
async function showAccount() {
  accountFingerprint = "";
  if (!accountDialog.open) accountDialog.showModal();
  await updateAccount();
}
async function updateAccount() {
  if (accountPolling || !accountDialog.open) return;
  accountPolling = true;
  try {
    const value = await api("/api/account"),
      s = value.session,
      signature = JSON.stringify(value);
    if (signature === accountFingerprint) return;
    accountFingerprint = signature;
    accountContent.replaceChildren();
    if (!s) {
      accountContent.append(
        node(
          "p",
          value.busy
            ? "Account setup is open in another browser. Return there or wait for it to expire."
            : "No sign-in is in progress. Open Operations to start.",
          "muted",
        ),
      );
      return;
    }
    accountHeading.textContent =
      (s.adapter === "cursor"
        ? "Cursor"
        : s.adapter === "claude"
          ? "Claude"
          : "Codex") + " account";
    accountContent.append(
      node(
        "p",
        s.message,
        s.state === "succeeded"
          ? "good"
          : s.state === "failed" || s.state === "expired"
            ? "error"
            : "muted",
      ),
    );
    if (s.url) {
      const link = node(
        "a",
        "Open " +
          (s.adapter === "cursor"
            ? "Cursor"
            : s.adapter === "claude"
              ? "Claude"
              : "OpenAI") +
          " sign-in",
        "provider-login",
      );
      link.href = s.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      accountContent.append(link);
    }
    if (s.code) {
      accountContent.append(
        node("p", "Enter this one-time code on the provider page:", "muted"),
        node("code", s.code, "device-code"),
      );
    }
    if (s.needsCode) {
      const form = node("form"),
        label = node("label", "Code returned by Claude"),
        input = node("input");
      label.htmlFor = "account-code";
      input.id = "account-code";
      input.type = "password";
      input.autocomplete = "off";
      input.maxLength = 4096;
      input.required = true;
      input.spellcheck = false;
      const submit = node("button", "Complete sign-in", "primary");
      submit.type = "submit";
      form.append(label, input, submit);
      form.onsubmit = async (event) => {
        event.preventDefault();
        submit.disabled = true;
        const code = input.value.trim();
        input.value = "";
        try {
          await api("/api/account", { action: "code", session: s.id, code });
          accountFingerprint = "";
          await updateAccount();
        } catch (e) {
          notice(e.message);
        } finally {
          submit.disabled = false;
        }
      };
      accountContent.append(form);
    }
    if (!["succeeded", "failed", "cancelled", "expired"].includes(s.state)) {
      accountContent.append(
        node(
          "p",
          "Finish before " +
            new Date(s.expiresAt).toLocaleTimeString() +
            ". Passwords belong only on the provider website.",
          "hint",
        ),
        button("Cancel sign-in", async () => {
          await api("/api/account", { action: "cancel", session: s.id });
          await updateAccount();
        }),
      );
    } else
      accountContent.append(
        button("Back to Settings", async () => {
          accountDialog.close();
          accountContent.replaceChildren();
          await loadAccounts(false);
        }),
      );
  } catch (e) {
    accountContent.replaceChildren(node("p", e.message, "error"));
  } finally {
    accountPolling = false;
  }
}
setInterval(() => {
  if (signedIn && !document.hidden && accountDialog.open) void updateAccount();
}, 1500);
function reset(thread = null) {
  saveDraft();
  selected = thread;
  pageBefore = null;
  archivedView = false;
  generation++;
  fingerprint = "";
  latest = null;
  draftLocation = null;
  uploads = [];
  renderUploads();
  $("prompt").value = "";
  $("project-info").hidden = true;
  $("draft-hint").textContent = "";
  restoreDraft();
}
function renderUploads() {
  saveDraft();
  $("attachments").replaceChildren(
    ...uploads.map((item) =>
      button(item.name + " ×", () => {
        uploads = uploads.filter((x) => x.id !== item.id);
        renderUploads();
      }),
    ),
  );
}
function images(items) {
  const box = node("div", undefined, "images");
  for (const item of items) {
    const a = node("a");
    a.href = "/api/images/" + item.id;
    a.target = "_blank";
    a.rel = "noopener";
    const img = node("img");
    img.src = a.href;
    img.alt = item.name;
    a.append(img);
    box.append(a);
  }
  return box;
}
function empty() {
  const d = $("detail");
  d.replaceChildren();
  const intro = node("div", undefined, "welcome");
  intro.append(
    node("div", "◈", "welcome-icon"),
    node("h2", "What shall we work on?"),
    node(
      "p",
      "Start a conversation. Choose an agent. You decide when it runs.",
      "muted",
    ),
  );
  const ideas = node("div", undefined, "suggestions");
  for (const text of $("mode").value === "chat"
    ? [
        "Help me think through a design",
        "Explain a concept",
        "Review text I paste here",
      ]
    : [
        "Explain this project",
        "Review the architecture",
        "Plan the next milestone",
      ])
    ideas.append(
      button(text, () => {
        $("prompt").value = text;
        saveDraft();
        $("prompt").focus();
      }),
    );
  intro.append(ideas);
  d.append(intro);
}
function renderThread(data) {
  $("thread-title").textContent = data.conversation.title;
  document.title = data.conversation.title + " · agentd";
  const d = $("detail"),
    nearBottom = d.scrollHeight - d.scrollTop - d.clientHeight < 120;
  d.replaceChildren();
  for (const t of data.messages) {
    const turn = node("article", undefined, "turn");
    const user = node("div", undefined, "user-message");
    user.append(node("div", t.prompt, "message-text"), images(t.images ?? []));
    turn.append(user);
    const response = node("div", undefined, "agent-message");
    const head = node("div", undefined, "message-head");
    head.append(
      node(
        "strong",
        t.merge_parent && !t.log && !t.revision_of && !t.retry_of
          ? "◈ Base integration"
          : t.adapter === "cursor"
            ? "◉ Cursor"
            : t.adapter === "codex"
              ? "◈ Codex"
              : "✳ Claude",
      ),
      node(
        "span",
        t.status === "succeeded" && t.review === "pending"
          ? "Changes ready for review"
          : (labels[t.status] ?? t.status),
        "status " + t.status,
      ),
    );
    response.append(head);
    if (t.outputTruncated)
      response.append(
        node(
          "p",
          "Showing the latest output. Open Run activity to download a larger excerpt.",
          "muted",
        ),
      );
    if (t.answerTruncated)
      response.append(
        node("p", "Answer excerpt only. View log for more output.", "muted"),
      );
    if (t.answer) response.append(renderMarkdown(t.answer));
    else if (t.output)
      response.append(
        node(
          "p",
          "Output is available in View log. This run has no separate answer record.",
          "muted",
        ),
      );
    else
      response.append(
        node(
          "p",
          t.status === "waiting_for_approval"
            ? t.mode === "edit"
              ? "Ready to edit this project in an isolated workspace."
              : "Ready when you are."
            : pending(t.status)
              ? "Waiting for the agent’s response…"
              : "No answer was recorded.",
          "muted",
        ),
      );
    if (["running", "queued", "cancelling"].includes(t.status)) {
      const progress = node("p", "", "run-progress");
      progress.dataset.started = t.updated;
      progress.dataset.state = t.status;
      response.append(progress);
    }
    if (t.execution) {
      const execution = JSON.parse(t.execution);
      if (t.status === "waiting_for_approval")
        response.append(
          node("p", executionSummary(execution), "approval-summary"),
        );
      response.append(executionDetails(execution));
    }
    if (t.settings_error)
      response.append(
        node("p", t.settings_error, "error"),
        button("Change settings", () => openSettings()),
      );
    if (t.error) response.append(node("p", t.error, "error"));
    if (t.mode === "chat")
      response.append(
        node("p", "Chat only · no project access or execution tools", "muted"),
      );
    if (t.retry_of)
      response.append(
        node(
          "p",
          "New attempt of an earlier run · original inputs and revision retained.",
          "muted",
        ),
      );
    const actions = node("div", undefined, "actions");
    if (t.status === "waiting_for_approval" && !t.settings_error) {
      actions.append(
        button(
          "Run",
          () =>
            api("/api/action", {
              op: "approve",
              id: t.id,
              fingerprint: JSON.parse(t.execution).fingerprint,
            }),
          "primary",
        ),
        button("Cancel", () => api("/api/action", { op: "cancel", id: t.id })),
      );
    } else if (t.status === "waiting_for_approval")
      actions.append(
        button("Cancel", () => api("/api/action", { op: "cancel", id: t.id })),
      );
    if (
      !pageBefore &&
      !archivedView &&
      t.id === data.messages.at(-1)?.id &&
      ["failed", "timed_out", "interrupted", "cancelled"].includes(t.status)
    )
      actions.append(
        button("Restart with current settings", async () => {
          if (
            !confirm(
              "Create a new attempt using current settings? Partial edits will be preserved and the new attempt requires approval.",
            )
          )
            return;
          const next = await api("/api/action", {
            op: "restart-settings",
            id: t.id,
          });
          reset(next.conversation);
          await refresh();
        }),
      );
    if (t.mode === "edit") {
      const reviewState = {
        pending: "Changes are waiting for your review.",
        committed: "Changes committed to a local branch.",
        discarded: "Changes were discarded.",
        superseded: "Changes continue in a later revision request.",
      }[t.review];
      if (reviewState) response.append(node("p", reviewState, "muted"));
      if (t.worktree && !pending(t.status))
        actions.prepend(
          button(
            t.review === "committed"
              ? "View committed changes"
              : "Review changes",
            () => openReview(t.id),
            t.review === "pending" ? "primary" : "",
          ),
        );
    }
    if (
      !pageBefore &&
      !archivedView &&
      t.id === data.messages.at(-1)?.id &&
      ["failed", "timed_out", "interrupted", "cancelled"].includes(t.status)
    ) {
      const reason =
        t.status === "timed_out"
          ? "This run reached its time limit. A retry starts over with the same limit."
          : t.status === "interrupted"
            ? "The service stopped before the run finished."
            : t.status === "cancelled"
              ? "This run was stopped."
              : "The agent could not complete this run. Check its output above; reconnect in Operations if it reports a sign-in problem.";
      response.append(node("p", reason, "attention"));
      if (t.review === "pending")
        response.append(
          node(
            "p",
            "Review any partial changes first. Commit them and send a follow-up, or discard the review to retry from the original revision. The old files are retained.",
            "muted",
          ),
        );
      else if (t.commit_sha)
        response.append(
          node(
            "p",
            "Changes from this run are committed. Send a follow-up to continue from them.",
            "muted",
          ),
        );
      else {
        const retry = button("Retry run", async () => {
          if (
            !confirm(
              "Create a new attempt with the same prompt, images and original revision? Partial edits will not be copied. You will approve it before it runs.",
            )
          )
            return;
          await api("/api/action", { op: "retry", id: t.id });
          fingerprint = "";
          notice(
            "New attempt ready. Review it, then approve when you are ready.",
          );
        });
        const supported =
          policy.enabledAdapters.includes(t.adapter) &&
          (t.mode !== "edit" || policy.editAdapters.includes(t.adapter));
        retry.disabled = !supported;
        actions.append(retry);
        if (!supported)
          response.append(
            node(
              "p",
              "This agent or work mode is unavailable. Settings shows the reason.",
              "muted",
            ),
          );
      }
      actions.append(button("Account status", () => openPreferences()));
    }
    actions.append(
      button(t.log ? "View log" : "Activity", () => openRun(t.id)),
    );
    response.append(actions);
    const meta = node("details");
    meta.append(
      node("summary", "Run history"),
      node(
        "p",
        `Based on commit ${t.revision.slice(0, 7)} · sent ${new Date(t.created).toLocaleString()}`,
        "muted",
      ),
    );
    response.append(meta);
    turn.append(response);
    d.append(turn);
  }
  const pages = node("div", undefined, "actions history-navigation");
  if (data.olderBefore)
    pages.append(
      button("Earlier turns", () => {
        pageBefore = data.olderBefore;
        fingerprint = "";
      }),
    );
  if (pageBefore)
    pages.append(
      button("Latest turns", () => {
        pageBefore = null;
        fingerprint = "";
      }),
    );
  if (pages.childNodes.length) d.prepend(pages);
  if (nearBottom || !fingerprint) d.scrollTop = d.scrollHeight;
}
async function refresh() {
  if (busy) return;
  busy = true;
  const epoch = generation;
  try {
    const capabilities = await api("/api/capabilities");
    policy = {
      editAdapters: capabilities.editAdapters ?? [],
      enabledAdapters: capabilities.enabledAdapters ?? ["codex", "claude"],
      strictWorkers: capabilities.strictWorkers,
      adapters: capabilities.adapters,
      scopedSettings: capabilities.scopedSettings,
    };
    applyPolicy();
    const list = await api("/api/projects");
    if (epoch !== generation) return;
    projects = list;
    signedIn = true;
    $("login").hidden = true;
    $("workspace").hidden = false;
    if (!selected && !projects.some((p) => p.id === projectId))
      projectId = projects[0]?.id ?? null;
    if (
      $("projects").dataset.signature !== JSON.stringify([projects, projectId])
    ) {
      $("projects").dataset.signature = JSON.stringify([projects, projectId]);
      $("projects").replaceChildren(
        ...projects.map((p) => {
          const b = button(
            "",
            () => {
              saveDraft();
              projectId = p.id;
              reset();
            },
            "project" + (p.id === projectId ? " selected" : ""),
          );
          b.append(
            node("span", "▱ " + p.name),
            node("small", String(p.conversations)),
          );
          return b;
        }),
      );
    }
    $("project-name").textContent =
      projects.find((p) => p.id === projectId)?.name ?? "Workspace";
    const threads = projectId
      ? await api("/api/projects/" + projectId + "/conversations")
      : [];
    if (epoch !== generation) return;
    if ($("tasks").dataset.signature !== JSON.stringify([threads, selected])) {
      $("tasks").dataset.signature = JSON.stringify([threads, selected]);
      $("tasks").replaceChildren(
        ...threads.map((t) => {
          const b = button(
            "",
            () => reset(t.id),
            "thread" + (selected === t.id ? " selected" : ""),
          );
          b.append(
            node("span", t.title),
            node("small", labels[t.status] ?? "New"),
          );
          return b;
        }),
      );
      if (!threads.length)
        $("tasks").append(
          node("p", "Your conversations will appear here.", "empty-list"),
        );
    }
    if (draftLocation !== draftKey()) {
      saveDraft();
      $("prompt").value = "";
      uploads = [];
      restoreDraft();
      renderUploads();
    }
    if (policy.scopedSettings && projectId) {
      const key = composerKey(),
        value = await api("/api/settings", {
          action: "view",
          project: projectId,
          conversation: selected,
          agent: $("adapter").value,
          mode: $("mode").value,
          overrides: nextRun[$("adapter").value] ?? {},
        });
      if (epoch !== generation || key !== composerKey()) return;
      composerPolicy = { key, allowedModes: value.allowedModes };
      const effective = value.effective?.selection;
      $("selection-summary").dataset.model = effective
        ? effective.model === "provider"
          ? "Default model"
          : effective.model
        : "";
      $("selection-summary").textContent = effective
        ? `${effective.model === "provider" ? "Provider default model" : effective.model} · ${effective.effort === "provider" ? "default effort" : effective.effort + " effort"}`
        : "Choose a model and effort";
      applyPolicy();
    }
    if (selected) {
      const data = await api(
        "/api/conversations/" +
          selected +
          (pageBefore ? "?before=" + pageBefore : ""),
      );
      if (epoch !== generation) return;
      archivedView = !!data.conversation.archived || !!data.project.archived;
      $("project-name").textContent = data.project.name;
      latest = data.messages.at(-1);
      const next = JSON.stringify(data);
      if (next !== fingerprint) {
        renderThread(data);
        fingerprint = next;
      }
    } else {
      archivedView = false;
      $("thread-title").textContent = "New conversation";
      document.title = "agentd";
      latest = null;
      if (!fingerprint) {
        empty();
        fingerprint = "empty";
      }
    }
    const running = !!latest && ["queued", "running"].includes(latest.status);
    $("stop-current").hidden = !running;
    $("send").hidden = running;
    $("rename").hidden = !selected;
    $("archive").hidden = !selected;
    const locked =
      latest && (pending(latest.status) || latest.review === "pending");
    $("send").disabled =
      submitting ||
      !!pageBefore ||
      archivedView ||
      !!locked ||
      uploading ||
      !projectId ||
      !policy.enabledAdapters.length ||
      (composerPolicy?.key === composerKey() &&
        !composerPolicy.allowedModes.length);
    $("hint").textContent =
      composerPolicy?.key === composerKey() &&
      !composerPolicy.allowedModes.length
        ? "Runs are disabled by the effective environment settings. Open Agent settings to change them."
        : archivedView
          ? "This conversation is archived. Restore it through History to continue."
          : pageBefore
            ? "Viewing earlier turns. Return to the latest turns to continue."
            : locked
              ? latest?.review === "pending"
                ? "Review, request revisions, commit or discard these changes before continuing."
                : "Approve or stop the current run before sending the next message."
              : $("mode").value === "chat"
                ? "Chat only · text you paste here, no project access."
                : "";
    if ($("operations-dialog").open) void loadOperations(false);
    if ($("preferences-dialog").open) void loadAccounts(false);
  } catch (e) {
    if (
      signedIn &&
      /^(Conversation|Project) not found$/.test(e.message) &&
      (selected || projectId)
    ) {
      // The remembered conversation was archived, removed or rolled back: start fresh.
      if (e.message.startsWith("Project")) projectId = projects[0]?.id ?? null;
      reset();
      notice();
    } else if (signedIn) notice(e.message);
  } finally {
    busy = false;
    if (epoch !== generation) refresh();
  }
}
$("loginform").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api("/api/login", { key: $("key").value });
    $("key").value = "";
    notice();
    await refresh();
  } catch (e) {
    notice(e.message);
  }
};
$("logout").onclick = async () => {
  try {
    await api("/api/logout", {});
    clearDrafts();
    signedIn = false;
    reset();
    projectId = null;
    $("workspace").hidden = true;
    $("login").hidden = false;
  } catch (e) {
    notice(e.message);
  }
};
$("new").onclick = () => {
  reset();
  refresh();
  $("prompt").focus();
};
$("add-project").onclick = () => $("project-dialog").showModal();
$("project-close").onclick = () => $("project-dialog").close();
$("project-form").onsubmit = async (e) => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    const p = await api("/api/action", {
      op: "project-create",
      name: $("project-input").value,
    });
    saveDraft();
    projectId = p.id;
    reset();
    $("project-dialog").close();
    $("project-input").value = "";
    notice();
    await refresh();
  } catch (e) {
    notice(e.message);
  } finally {
    b.disabled = false;
  }
};
$("rename").onclick = async () => {
  const name = prompt("Conversation name", $("thread-title").textContent);
  if (name === null) return;
  try {
    await api("/api/action", { op: "conversation-rename", id: selected, name });
    fingerprint = "";
    await refresh();
  } catch (e) {
    notice(e.message);
  }
};
$("archive").onclick = async () => {
  if (!confirm("Archive this conversation? Its runs and files will be kept."))
    return;
  try {
    await api("/api/action", { op: "conversation-archive", id: selected });
    reset();
    await refresh();
  } catch (e) {
    notice(e.message);
  }
};
$("project-menu").onclick = () => {
  const box = $("project-info");
  box.hidden = !box.hidden;
  const p = projects.find((p) => p.id === projectId);
  if (!p) return;
  box.replaceChildren(
    node("strong", p.name),
    node("p", p.repo, "path"),
    node(
      "p",
      "Local Git repository · Ask or Edit files, with approval before each run",
      "muted",
    ),
    ...(p.github_url
      ? [
          node("p", p.github_url + " · " + p.github_branch, "path"),
          button("Pull updates", async () => {
            if (
              !confirm(
                "Update this project from its GitHub branch? Only clean, forward updates are allowed. Existing conversations keep their pinned revision; start a new conversation to use updated files.",
              )
            )
              return;
            await api("/api/repositories", {
              action: "start",
              kind: "update",
              project: p.id,
            });
            $("repository-dialog").showModal();
            await updateRepositories();
          }),
        ]
      : []),
    button("Set up checks", () => openCheckSetup(p.id)),
    button("Rename project", async () => {
      const name = prompt("Project name", p.name);
      if (name === null) return;
      await api("/api/action", { op: "project-rename", id: p.id, name });
      box.hidden = true;
    }),
    button("Archive project", async () => {
      if (
        !confirm(
          "Archive this project and hide its conversations? Files and history will be kept. You can restore it in History.",
        )
      )
        return;
      await api("/api/action", { op: "project-archive", id: p.id });
      saveDraft();
      projectId = null;
      reset();
      box.hidden = true;
    }),
  );
};

$("files").onchange = async () => {
  const epoch = generation;
  uploading = true;
  $("send").disabled = true;
  try {
    const files = Array.from($("files").files);
    if (uploads.length + files.length > 4)
      throw Error("Attach up to four images.");
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024)
        throw Error("Each image must be at most 5 MB.");
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const item = await api("/api/upload", { name: file.name, data });
      if (epoch !== generation) break;
      uploads.push(item);
      renderUploads();
    }
  } catch (e) {
    notice(e.message);
  } finally {
    $("files").value = "";
    uploading = false;
    refresh();
  }
};
$("compose").onsubmit = async (e) => {
  e.preventDefault();
  if (submitting || pageBefore || archivedView) return;
  submitting = true;
  $("prompt").disabled = true;
  $("send").disabled = true;
  applyPolicy();
  const epoch = generation;
  const submittedDraft = draftLocation;
  try {
    const t = await api("/api/action", {
      op: "create",
      project: projectId,
      conversation: selected,
      adapter: $("adapter").value,
      mode: $("mode").value,
      prompt: $("prompt").value,
      attachments: uploads.map((x) => x.id),
      overrides: nextRun[$("adapter").value] ?? {},
    });
    forgetDraft(submittedDraft);
    if (epoch === generation) {
      draftLocation = null;
      reset(t.conversation);
      notice();
    }
    await refresh();
  } catch (e) {
    notice(e.message);
  } finally {
    submitting = false;
    $("prompt").disabled = false;
    applyPolicy();
    await refresh();
  }
};
async function openReview(id) {
  const value = await api("/api/tasks/" + id + "/review");
  reviewTask = id;
  reviewTree = value.tree;
  const content = $("review-content");
  const stats = diffStats(value.patch);
  $("review-stats").textContent =
    `${value.files.length} ${value.files.length === 1 ? "file" : "files"} changed · +${stats.additions} −${stats.deletions}` +
    (value.commit ? " · committed" : "");
  content.replaceChildren();
  if (value.mergeParent)
    content.append(
      node(
        "p",
        "Base integration preserves both histories. Review the complete combined changes before committing.",
        "muted",
      ),
    );
  if (value.conflicts?.length)
    content.append(
      node(
        "p",
        "Resolve conflict markers in: " +
          value.conflicts.join(", ") +
          ". Use Request revisions to ask your agent, then approve that run.",
        "error",
      ),
    );
  if (value.blocked.length)
    content.append(
      node(
        "p",
        "These changes require separate review: " +
          value.blocked.join(", "),
        "error",
      ),
    );
  if (value.truncated)
    content.append(
      node(
        "p",
        "This diff is too large to approve here. Review and reduce it locally.",
        "error",
      ),
    );
  content.append(renderDiff(value.patch));
  const checkState = value.checks
    ? value.checks.tree !== value.tree
      ? "Outdated · the changes differ from what was checked"
      : ({
          passed: "Passed on exactly these changes",
          failed: "Failed",
          running: "Running…",
          cancelled: "Stopped",
          timed_out: "Time limit reached",
          stale: "Outdated · files changed while checking",
          interrupted: "Interrupted",
        }[value.checks.status] ?? value.checks.status)
    : "Not run yet";
  const checksBox = node("section", undefined, "review-checks");
  checksBox.append(
    node("h3", "Checks"),
    node(
      "p",
      checkState,
      value.checks?.status === "passed" && value.checks.tree === value.tree
        ? "good"
        : "muted",
    ),
  );
  if (value.checks?.output)
    checksBox.append(node("pre", value.checks.output, "result"));
  content.prepend(checksBox);
  const actions = $("review-actions");
  actions.replaceChildren();
  if (value.decision === "pending") {
    // Know whether checks can run before offering them as the next step.
    let setup = null;
    try {
      setup = await api(
        "/api/check-setup?project=" +
          encodeURIComponent(value.project) +
          "&task=" +
          encodeURIComponent(id),
      );
    } catch {}
    const checksReady = !!setup?.plan?.ready;
    const revise = button("Request revisions", () => {
      revisionTarget = { id, tree: value.tree };
      $("revision-prompt").value = "";
      $("revision-dialog").showModal();
    });
    revise.disabled = value.truncated || !!value.blocked.length;
    const setUp = button("Set up checks", () =>
      openCheckSetup(value.project, id),
    );
    const check = button("Run checks", async () => {
      await api("/api/action", { op: "validate", id, tree: value.tree });
      checking = id;
      actions.replaceChildren(
        button(
          "Stop checks",
          () => api("/api/action", { op: "cancel", id }),
          "danger",
        ),
      );
      checksBox.lastChild.textContent = "Running…";
    });
    check.disabled = !!value.conflicts?.length || !checksReady;
    const passed =
      value.checks?.status === "passed" && value.checks?.tree === value.tree;
    const commitReady =
      (value.files.length || value.mergeParent) &&
      !value.conflicts?.length &&
      !value.truncated &&
      !value.blocked.length &&
      passed;
    let next;
    if (value.conflicts?.length)
      next =
        "Resolve the conflicts first. Use Request revisions to ask your agent.";
    else if (value.truncated || value.blocked.length)
      next = "Resolve the warnings above before committing.";
    else if (!checksReady)
      next = setup?.error
        ? "This project has no supported checks yet: " + setup.error
        : "Prepare this project’s dependencies, then run checks on these changes.";
    else if (!passed)
      next =
        "Run checks on these exact changes. A pass is required before you can commit.";
    if (commitReady) {
      const field = node("div", undefined, "commit-field");
      const label = node("label", "Commit message"),
        input = node("input");
      input.id = "commit-message";
      input.maxLength = 100;
      input.value = "Apply reviewed changes";
      label.htmlFor = input.id;
      field.append(label, input);
      checksBox.append(field);
      const commit = button(
        "Commit",
        async () => {
          await api("/api/action", {
            op: "commit",
            id,
            tree: value.tree,
            message: input.value.trim() || "Apply reviewed changes",
          });
          notice("Committed to a new local branch. Nothing was pushed.");
          await openReview(id);
        },
        "primary",
      );
      actions.append(commit, revise);
    } else {
      (checksReady ? check : setUp).classList.add("primary");
      actions.append(
        checksReady ? check : setUp,
        checksReady ? setUp : check,
        revise,
      );
    }
    if (next) checksBox.append(node("p", next, "next-step"));

    actions.append(
      button(
        "Discard review",
        async () => {
          if (
            !confirm(
              "Continue without these changes? The worktree will be retained, but the next turn will not include these edits.",
            )
          )
            return;
          await api("/api/action", { op: "discard", id });
          $("review-dialog").close();
          reviewTask = null;
        },
        "danger",
      ),
    );
  } else if (value.decision === "superseded") {
    content.append(
      node(
        "p",
        "These changes were preserved in a revision request. Continue in the latest turn.",
        "muted",
      ),
    );
  } else if (value.commit) {
    if (
      value.checks?.input !== "git-tree-v1" ||
      value.checks?.status !== "passed"
    ) {
      content.append(
        node(
          "p",
          "These committed files need fresh snapshot checks before publication. Earlier checks are no longer accepted.",
          "attention",
        ),
      );
      actions.append(
        button(
          "Recheck committed files",
          async () => {
            await api("/api/action", { op: "validate", id, tree: value.tree });
            checking = id;
          },
          "primary",
        ),
      );
    }

    content.append(
      node("p", `Committed on ${value.branch}`, "muted"),
      node("p", value.commit, "path"),
      button("Publish to GitHub", () => openPublishing(id, value.project)),
      button("GitHub feedback and conflicts", () =>
        openFeedback(id, value.project),
      ),
    );
  }
  if (!$("review-dialog").open) $("review-dialog").showModal();
}
$("review-close").onclick = () => {
  $("review-dialog").close();
  reviewTask = null;
};
setInterval(async () => {
  if (!checking) return;
  const id = checking;
  try {
    const data = await api("/api/tasks/" + id);
    const checks = JSON.parse(data.task.checks ?? "{}");
    if (checks.status !== "running") {
      checking = false;
      if (reviewTask === id) await openReview(id);
      notice();
    }
  } catch (e) {
    checking = false;
    notice(e.message);
  }
}, 2000);
let historyEpoch = 0,
  historyCursor = null;
async function loadHistory(before = null) {
  const epoch = ++historyEpoch,
    query = $("history-query").value,
    filter = $("history-filter").value;
  $("history-results").replaceChildren(node("p", "Searching…", "muted"));
  $("history-pages").replaceChildren();
  try {
    const [result, archived] = await Promise.all([
      api(
        "/api/history?q=" +
          encodeURIComponent(query) +
          "&filter=" +
          filter +
          (before ? "&before=" + before : ""),
      ),
      api("/api/archived-projects"),
    ]);
    if (epoch !== historyEpoch || !$("history-dialog").open) return;
    $("history-results").replaceChildren();
    for (const item of result.items) {
      const card = node("article", undefined, "operation-task");
      card.append(
        node("strong", item.title),
        node(
          "p",
          item.projectName +
            " · " +
            (labels[item.status] ?? "New") +
            (item.archived || item.projectArchived ? " · Archived" : ""),
          "muted",
        ),
      );
      const actions = node("div", undefined, "actions");
      actions.append(
        button("Open", () => {
          saveDraft();
          projectId = item.project;
          reset(item.id);
          $("history-dialog").close();
        }),
      );
      if (item.projectArchived)
        actions.append(
          button("Restore project", async () => {
            await api("/api/action", {
              op: "project-restore",
              id: item.project,
            });
            await loadHistory(before);
          }),
        );
      else if (item.archived)
        actions.append(
          button("Restore conversation", async () => {
            await api("/api/action", {
              op: "conversation-restore",
              id: item.id,
            });
            await loadHistory(before);
          }),
        );
      card.append(actions);
      $("history-results").append(card);
    }
    if (!result.items.length)
      $("history-results").append(
        node("p", "No conversations match this search.", "muted"),
      );
    historyCursor = result.next;
    $("history-pages").replaceChildren();
    if (before)
      $("history-pages").append(button("Newest results", () => loadHistory()));
    if (historyCursor)
      $("history-pages").append(
        button("More results", () => loadHistory(historyCursor)),
      );
    $("archived-projects").replaceChildren();
    if (filter !== "active" && archived.length) {
      $("archived-projects").append(node("h3", "Archived projects"));
      for (const p of archived)
        $("archived-projects").append(
          button("Restore " + p.name, async () => {
            await api("/api/action", { op: "project-restore", id: p.id });
            await loadHistory();
          }),
        );
    }
  } catch (e) {
    if (epoch === historyEpoch)
      $("history-results").replaceChildren(node("p", e.message, "error"));
  }
}
$("history-menu").onclick = () => {
  $("history-dialog").showModal();
  void loadHistory();
};
$("history-close").onclick = () => {
  $("history-dialog").close();
  historyEpoch++;
};
$("history-form").onsubmit = (e) => {
  e.preventDefault();
  void loadHistory();
};
$("history-filter").onchange = () => loadHistory();
let runId = null,
  runBusy = false,
  runFingerprint = "";
async function openRun(id) {
  runId = id;
  runFingerprint = "";
  $("run-dialog").showModal();
  $("run-content").replaceChildren(node("p", "Loading activity…", "muted"));
  await updateRun();
}
async function updateRun() {
  if (runBusy || !runId || !$("run-dialog").open) return;
  runBusy = true;
  const id = runId;
  try {
    const data = await api("/api/tasks/" + id);
    if (runId !== id || !$("run-dialog").open) return;
    const signature = JSON.stringify(data);
    if (signature === runFingerprint) return;
    runFingerprint = signature;
    const box = $("run-content");
    box.replaceChildren(
      node(
        "p",
        labels[data.task.status] ?? data.task.status,
        "status " + data.task.status,
      ),
    );
    if (data.task.execution)
      box.append(executionDetails(JSON.parse(data.task.execution)));
    const timeline = node("ol", undefined, "run-timeline");
    for (const event of data.events) {
      const row = node("li");
      row.append(
        node("strong", labels[event.status] ?? event.status),
        node("span", new Date(event.at).toLocaleString(), "muted"),
      );
      timeline.append(row);
    }
    box.append(timeline);
    if (data.task.error) box.append(node("p", data.task.error, "error"));
    box.append(
      node("h3", "Latest output"),
      node(
        "p",
        "The live view shows up to 60 KB. Downloads contain the latest 512 KB and identify omitted output.",
        "muted",
      ),
      node("pre", data.output || "No output recorded yet.", "result"),
    );
    const link = node("a", "Download latest output", "output-download");
    link.href = "/api/tasks/" + id + "/output";
    link.download = "agentd-" + id + ".txt";
    box.append(link);
    if (["queued", "running"].includes(data.task.status))
      box.append(
        button(
          "Stop run",
          () => api("/api/action", { op: "cancel", id }),
          "danger",
        ),
      );
  } catch (e) {
    if (runId === id)
      $("run-content").replaceChildren(node("p", e.message, "error"));
  } finally {
    runBusy = false;
  }
}
$("run-close").onclick = () => {
  $("run-dialog").close();
  runId = null;
};
setInterval(() => {
  if (signedIn && !document.hidden) void updateRun();
}, 2000);
notice();
refresh();
setInterval(() => {
  if (signedIn && !document.hidden) refresh();
}, 3000);

let repositorySource = null,
  repositoryRendered = "",
  repositoryPolling = false,
  githubRendered = "",
  githubPolling = false;
$("import-open").onclick = () => {
  $("project-dialog").close();
  $("repository-dialog").showModal();
  void updateRepositories();
};
$("repository-close").onclick = () => $("repository-dialog").close();
$("repository-url").oninput = () => {
  repositorySource = null;
  $("repository-import").hidden = true;
};
async function repositorySubmit(e, input) {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    await api("/api/repositories", { action: "start", ...input });
    repositoryRendered = "";
    await updateRepositories();
  } catch (e) {
    notice(e.message);
  } finally {
    b.disabled = false;
  }
}
$("repository-form").onsubmit = (e) => {
  repositorySource = null;
  $("repository-import").hidden = true;
  void repositorySubmit(e, { kind: "inspect", url: $("repository-url").value });
};
$("repository-import").onsubmit = (e) =>
  void repositorySubmit(e, {
    kind: "import",
    url: repositorySource,
    branch: $("repository-branch").value,
    name: $("repository-name").value,
  });
async function updateRepositories() {
  if (repositoryPolling || !$("repository-dialog").open || !signedIn) return;
  repositoryPolling = true;
  try {
    const jobs = await api("/api/repositories");
    if (!$("repository-dialog").open) return;
    const signature = JSON.stringify(jobs);
    if (signature === repositoryRendered) return;
    repositoryRendered = signature;
    const box = $("repository-status");
    box.replaceChildren();
    for (const job of jobs) {
      const item = node("section");
      item.append(
        node(
          "strong",
          ({
            inspect: "Find branches",
            import: "Import project",
            update: "Pull updates",
          }[job.kind] ?? job.kind) +
            " · " +
            ({
              running: "In progress",
              succeeded: "Complete",
              failed: "Failed",
              cancelled: "Cancelled",
              interrupted: "Interrupted",
            }[job.state] ?? job.state),
        ),
        node("p", job.source + (job.branch ? " · " + job.branch : ""), "path"),
      );
      if (job.error) item.append(node("p", job.error));
      if (job.state === "running")
        item.append(
          button("Cancel operation", async () => {
            await api("/api/repositories", { action: "cancel", job: job.id });
            repositoryRendered = "";
            await updateRepositories();
          }),
        );
      if (
        job.kind === "inspect" &&
        job.state === "succeeded" &&
        job.source ===
          $("repository-url")
            .value.trim()
            .toLowerCase()
            .replace(/\/$/, "")
            .replace(/(?:\.git)?$/, ".git") &&
        repositorySource !== job.source
      ) {
        repositorySource = job.source;
        $("repository-branch").replaceChildren(
          ...job.result.branches.map((b) => {
            const o = node("option", b);
            o.value = b;
            return o;
          }),
        );
        $("repository-branch").value = job.result.defaultBranch;
        $("repository-name").value = job.source
          .split("/")
          .pop()
          .replace(/\.git$/, "");
        $("repository-import").hidden = false;
      }
      if (job.kind === "import" && job.state === "succeeded")
        item.append(
          button("Open project", async () => {
            saveDraft();
            projectId = job.result.project;
            reset();
            $("repository-dialog").close();
            await refresh();
          }),
        );
      if (job.kind === "update" && job.state === "succeeded")
        item.append(
          node(
            "p",
            job.result.changed
              ? "Updated. Start a new conversation to use the latest files."
              : "Already up to date.",
          ),
        );
      box.append(item);
    }
  } catch (e) {
    notice(e.message);
  } finally {
    repositoryPolling = false;
  }
}
$("github-open").onclick = () => {
  $("github-dialog").showModal();
  githubRendered = "";
  void updateGithub();
};
$("github-close").onclick = () => {
  $("github-dialog").close();
  $("github-content").replaceChildren();
  githubRendered = "";
};
async function githubAction(action, session) {
  await api("/api/github", { action, session });
  githubRendered = "";
  await updateGithub();
}
async function updateGithub() {
  if (githubPolling || !$("github-dialog").open || !signedIn) return;
  githubPolling = true;
  try {
    const data = await api("/api/github");
    if (!$("github-dialog").open) return;
    const signature = JSON.stringify(data);
    if (signature === githubRendered) return;
    githubRendered = signature;
    const box = $("github-content");
    box.replaceChildren(
      node(
        "p",
        data.connected
          ? "A GitHub connection is saved. Importing verifies repository access."
          : "No GitHub connection saved.",
      ),
    );
    const session = data.session;
    if (session) {
      box.append(node("p", session.message));
      if (session.code) {
        const link = node("a", "Open GitHub");
        link.href = session.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        box.append(node("pre", session.code), link);
      }
      if (data.busy)
        box.append(
          button("Cancel sign-in", () => githubAction("cancel", session.id)),
        );
    } else if (data.busy)
      box.append(node("p", "Sign-in is in progress in another browser."));
    if (!data.installed)
      box.append(
        node(
          "p",
          "GitHub CLI is unavailable. Install the repository-import release on the server.",
        ),
      );
    else if (!data.busy) {
      box.append(
        button(data.connected ? "Reconnect GitHub" : "Connect GitHub", () =>
          githubAction("start"),
        ),
      );
      if (data.connected)
        box.append(
          button("Disconnect", async () => {
            if (
              confirm(
                "Remove the GitHub connection saved on this server? Existing projects remain available.",
              )
            )
              await githubAction("logout");
          }),
        );
    }
  } catch (e) {
    notice(e.message);
  } finally {
    githubPolling = false;
  }
}
setInterval(() => {
  if (signedIn && !document.hidden) {
    void updateRepositories();
    void updateGithub();
  }
}, 1500);

let setupTarget = null,
  setupPolling = false,
  setupSignature = "";
async function openCheckSetup(project, task) {
  setupTarget = { project, task };
  setupSignature = "";
  $("check-setup-dialog").showModal();
  await updateCheckSetup();
}
$("check-setup-close").onclick = () => {
  $("check-setup-dialog").close();
  if (reviewTask && $("review-dialog").open) void openReview(reviewTask);
  setupTarget = null;
};
async function updateCheckSetup() {
  if (
    setupPolling ||
    !setupTarget ||
    !signedIn ||
    !$("check-setup-dialog").open
  )
    return;
  setupPolling = true;
  const target = setupTarget;
  try {
    const value = await api(
      "/api/check-setup?project=" +
        encodeURIComponent(target.project) +
        (target.task ? "&task=" + encodeURIComponent(target.task) : ""),
    );
    if (setupTarget !== target || !$("check-setup-dialog").open) return;
    const signature = JSON.stringify(value);
    if (signature === setupSignature) return;
    setupSignature = signature;
    const box = $("check-setup-content");
    box.replaceChildren(
      node(
        "p",
        target.task
          ? "Setup for the edits currently awaiting review."
          : "Setup for this project’s current checkout.",
        "muted",
      ),
    );
    if (value.error) box.append(node("p", value.error));
    if (value.plan) {
      box.append(
        node(
          "p",
          value.plan.ready
            ? "Dependencies are ready for these exact project files."
            : value.plan.legacy
              ? "An administrator-prepared dependency set is available. You can keep using it or prepare a GUI-managed set."
              : "Dependencies need preparation.",
        ),
        node("p", value.plan.packages + " locked packages · npm checks"),
        node("h3", "Commands you will approve separately when running checks"),
      );
      for (const [name, script] of Object.entries(value.plan.scripts))
        box.append(node("strong", name), node("pre", script, "diff"));
      box.append(
        node(
          "p",
          "Preparation downloads public npm packages in isolation. Install scripts are disabled. No account credentials or other projects are available. Limit: 512 MB and four minutes; private packages and workspaces are unsupported. Checks run later without network access; pre/post hooks are disabled.",
          "muted",
        ),
      );
      const prepare = button(
        value.plan.ready ? "Prepare again" : "Approve dependency preparation",
        async () => {
          if (
            !confirm(
              "Download the locked public npm packages for these exact files? Install scripts will not run.",
            )
          )
            return;
          await api("/api/check-setup", {
            action: "prepare",
            ...target,
            fingerprint: value.plan.fingerprint,
          });
          setupSignature = "";
          await updateCheckSetup();
        },
      );
      prepare.disabled = value.busy;
      box.append(prepare);
      if (value.plan.ready && target.task)
        box.append(
          button("Back to review", async () => {
            $("check-setup-dialog").close();
            setupTarget = null;
            await openReview(target.task);
          }),
        );
    }
    for (const job of value.jobs) {
      const item = node("section");
      item.append(
        node(
          "strong",
          {
            running: "Preparing dependencies…",
            succeeded: "Dependencies prepared",
            failed: "Preparation failed",
            cancelled: "Preparation cancelled",
            interrupted: "Preparation interrupted",
          }[job.state] ?? job.state,
        ),
      );
      if (job.error) item.append(node("p", job.error));
      if (job.state === "running")
        item.append(
          button("Cancel preparation", async () => {
            await api("/api/check-setup", { action: "cancel", id: job.id });
            setupSignature = "";
            await updateCheckSetup();
          }),
        );
      box.append(item);
    }
    if (value.busy && !value.jobs.some((j) => j.state === "running"))
      box.append(node("p", "Another project is preparing dependencies."));
  } catch (e) {
    notice(e.message);
  } finally {
    setupPolling = false;
  }
}
setInterval(() => {
  if (!document.hidden) void updateCheckSetup();
}, 1500);

let publishingTask = null,
  publishingPolling = false,
  publishingSignature = "";
async function openPublishing(task, project) {
  publishingTask = task;
  publishingSignature = "";
  $("publishing-base").value =
    projects.find((p) => p.id === project)?.github_branch ?? "main";
  for (const id of ["publishing-base", "publishing-title", "publishing-body"])
    $(id).disabled = false;
  $("publishing-title").value = "Apply reviewed changes";
  $("publishing-body").value = "";
  $("publishing-content").replaceChildren();
  $("publishing-target").replaceChildren(
    new Option("Create a new draft PR", ""),
  );
  for (const target of await api(
    "/api/publishing?targets=1&task=" + encodeURIComponent(task),
  )) {
    $("publishing-target").append(
      new Option("Update " + target.url, target.id),
    );
  }
  $("publishing-dialog").showModal();
  await updatePublishing();
}
$("publishing-close").onclick = () => {
  $("publishing-dialog").close();
  publishingTask = null;
};
$("publishing-form").onsubmit = async (e) => {
  e.preventDefault();
  const button = e.submitter;
  button.disabled = true;
  try {
    await api("/api/publishing", {
      action: "preview",
      task: publishingTask,
      updateOf: $("publishing-target").value || undefined,
      base: $("publishing-base").value.trim(),
      title: $("publishing-title").value,
      body: $("publishing-body").value,
    });
    publishingSignature = "";
    await updatePublishing();
  } catch (e) {
    $("publishing-content").replaceChildren(node("p", e.message, "error"));
  } finally {
    button.disabled = false;
  }
};
async function updatePublishing() {
  if (
    publishingPolling ||
    !publishingTask ||
    !signedIn ||
    !$("publishing-dialog").open
  )
    return;
  publishingPolling = true;
  const task = publishingTask;
  try {
    const jobs = await api("/api/publishing?task=" + encodeURIComponent(task));
    if (task !== publishingTask || !$("publishing-dialog").open) return;
    const signature = JSON.stringify(jobs);
    if (signature === publishingSignature) return;
    publishingSignature = signature;
    const box = $("publishing-content");
    box.replaceChildren();
    const job = jobs[0];
    if (!job) {
      box.append(
        node(
          "p",
          "Connect GitHub through Import from GitHub → GitHub connection first. This project needs a GitHub HTTPS origin and reviewed commits based on the current target branch.",
          "muted",
        ),
      );
      return;
    }
    box.append(
      node(
        "h3",
        {
          preparing: "Preparing preview…",
          ready: "Ready for your approval",
          publishing: "Verifying publication…",
          pushing: "Publishing branch…",
          branch_published: "Branch published; preparing PR…",
          creating_pr: "Creating draft PR…",
          published: "Published",
          needs_attention: "Check publication outcome",
          failed: "Preview unavailable",
          expired: "Preview expired",
        }[job.state] ?? job.state,
      ),
    );
    if (job.error)
      box.append(
        node("p", job.error, job.state === "published" ? "muted" : "error"),
      );
    if (job.state === "needs_attention")
      box.append(
        node(
          "p",
          "A branch or PR may already exist. Prepare a fresh preview; matching work is reused, and conflicting branches are never overwritten.",
          "muted",
        ),
      );
    const plan = job.plan;
    if (plan) {
      if (plan.previousHead && $("publishing-target").value) {
        $("publishing-base").value = plan.base;
        $("publishing-title").value = plan.title;
        $("publishing-body").value = plan.body;
      }
      box.append(
        node("p", "Repository: " + plan.destination, "path"),
        node("p", plan.branch + " → " + plan.base, "path"),
        node("p", "Commit: " + plan.head, "path"),
        node("p", "Reviewed base: " + plan.baseSha, "path"),
        node("strong", plan.title),
        node("pre", plan.body || "(No description)", "diff"),
        node("pre", plan.stat, "diff"),
      );
      for (const commit of plan.commits) {
        const details = node("details"),
          summary = node(
            "summary",
            commit.subject + " · " + commit.sha.slice(0, 12),
          );
        details.append(summary, node("pre", commit.patch, "diff"));
        box.append(details);
      }
      if (plan.previousHead)
        box.append(
          node(
            "p",
            "Update existing draft PR #" +
              plan.pullNumber +
              " from commit " +
              plan.previousHead +
              ". Its title and description are kept.",
            "muted",
          ),
        );
      box.append(
        node(
          "p",
          "All " +
            plan.commits.length +
            " outgoing commits are included above. Review their history, not only the final diff. Publishing can trigger GitHub Actions and notify repository subscribers.",
          "muted",
        ),
      );
    }
    if (job.url) {
      const link = node("a", "Open pull request");
      link.href = job.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      box.append(link);
    }
    if (job.state === "ready" && plan) {
      box.append(
        node(
          "p",
          "This preview expires 15 minutes after preparation. Changing the form requires a new preview.",
          "muted",
        ),
        button(
          plan.previousHead
            ? "Approve this preview: update draft PR"
            : "Approve this preview: push and create draft PR",
          () => {
            publicationApproval = { id: job.id, fingerprint: plan.fingerprint };
            $("publication-confirm-text").textContent =
              "Publish commit " +
              plan.head +
              " to " +
              plan.destination +
              (plan.previousHead
                ? " and update draft PR #" + plan.pullNumber
                : " and create the draft PR shown in the preview") +
              ". GitHub Actions and notifications may run.";
            $("publication-confirm-error").textContent = "";
            $("publication-confirm-dialog").showModal();
          },
          "primary",
        ),
      );
    }
  } catch (e) {
    notice(e.message);
  } finally {
    publishingPolling = false;
  }
}
setInterval(() => {
  if (!document.hidden) void updatePublishing();
}, 1500);

let revisionTarget = null;
$("revision-close").onclick = () => $("revision-dialog").close();
$("revision-form").onsubmit = async (e) => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    const task = await api("/api/action", {
      op: "revise",
      ...revisionTarget,
      prompt: $("revision-prompt").value,
    });
    $("revision-dialog").close();
    $("review-dialog").close();
    reviewTask = null;
    reset(task.conversation);
    await refresh();
    notice(
      "Revision request saved with the current edits. Approve its run to continue; new checks and commit approval will be required.",
    );
  } catch (e) {
    notice(e.message);
  } finally {
    b.disabled = false;
  }
};

$("publishing-target").onchange = () => {
  const updating = !!$("publishing-target").value;
  for (const id of ["publishing-base", "publishing-title", "publishing-body"])
    $(id).disabled = updating;
};

let publicationApproval = null;
$("publication-confirm-close").onclick = () =>
  $("publication-confirm-dialog").close();
$("publication-confirm-form").onsubmit = async (e) => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    await api("/api/publishing", { action: "approve", ...publicationApproval });
    $("publication-confirm-dialog").close();
    publishingSignature = "";
    await updatePublishing();
  } catch (e) {
    $("publication-confirm-error").textContent = e.message;
  } finally {
    b.disabled = false;
  }
};

let feedbackTask = null,
  feedbackSignature = "",
  feedbackPolling = false;
async function openFeedback(task, project) {
  feedbackTask = task;
  feedbackSignature = "";
  $("feedback-content").replaceChildren();
  $("feedback-base").value =
    projects.find((p) => p.id === project)?.github_branch ?? "main";
  $("feedback-target").replaceChildren();
  for (const t of await api(
    "/api/feedback?targets=1&task=" + encodeURIComponent(task),
  ))
    $("feedback-target").append(new Option(t.url, t.id));
  $("feedback-load").disabled = !$("feedback-target").options.length;
  $("feedback-dialog").showModal();
  await updateFeedback();
}
$("feedback-close").onclick = () => {
  $("feedback-dialog").close();
  feedbackTask = null;
};
async function prepareFeedback(kind) {
  await api("/api/feedback", {
    action: "prepare",
    task: feedbackTask,
    kind,
    publication: $("feedback-target").value,
    base: $("feedback-base").value,
  });
  feedbackSignature = "";
  await updateFeedback();
}
$("feedback-load").onclick = () =>
  prepareFeedback("comments").catch((e) => notice(e.message));
$("feedback-integrate").onclick = () =>
  prepareFeedback("integration").catch((e) => notice(e.message));
async function updateFeedback() {
  if (
    feedbackPolling ||
    !feedbackTask ||
    !signedIn ||
    !$("feedback-dialog").open
  )
    return;
  feedbackPolling = true;
  const task = feedbackTask;
  try {
    const jobs = await api("/api/feedback?task=" + encodeURIComponent(task));
    if (task !== feedbackTask) return;
    const signature = JSON.stringify(jobs);
    if (signature === feedbackSignature) return;
    feedbackSignature = signature;
    const box = $("feedback-content");
    box.replaceChildren();
    const job = jobs[0];
    if (!job) return;
    box.append(
      node(
        "h3",
        job.state === "preparing"
          ? "Preparing preview…"
          : job.state === "ready"
            ? "Review before continuing"
            : job.state,
      ),
    );
    if (job.error) box.append(node("p", job.error, "error"));
    const plan = job.plan;
    if (!plan) return;
    box.append(
      node(
        "p",
        "Snapshot of " + plan.destination + " at " + plan.sourceHead,
        "path",
      ),
    );
    const keys = [];
    let instruction = null;
    if (job.kind === "comments") {
      box.append(
        node(
          "p",
          "Select the comments you want to address and add your own instruction. This saves a new request requiring run approval. Nothing is posted to GitHub.",
          "muted",
        ),
      );
      if (plan.limited)
        box.append(
          node(
            "p",
            "This is a partial list. Each category is limited to 150 entries. Review the rest on GitHub.",
            "error",
          ),
        );
      for (const item of plan.items) {
        const card = node("section"),
          label = node("label"),
          check = document.createElement("input");
        check.type = "checkbox";
        check.disabled = item.truncated || job.state !== "ready";
        check.setAttribute("aria-label", "Select " + item.key);
        keys.push({ key: item.key, check });
        label.append(
          check,
          document.createTextNode(
            item.author +
              " · " +
              item.kind +
              (item.state ? " · " + item.state : ""),
          ),
        );
        card.append(label);
        if (item.path)
          card.append(
            node(
              "p",
              item.path +
                (item.line
                  ? " : " + item.line
                  : " · outdated or unavailable line"),
              "path",
            ),
          );
        if (item.commit && item.commit !== plan.sourceHead)
          card.append(
            node(
              "p",
              "Comment refers to another revision: " + item.commit,
              "muted",
            ),
          );
        card.append(node("pre", item.body, "result"));
        const link = node("a", "View on GitHub");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.append(link);
        if (item.truncated)
          card.append(
            node("p", "Truncated; cannot import this comment.", "error"),
          );
        box.append(card);
      }
      const label = node("label", "Your instruction"),
        field = document.createElement("textarea");
      field.id = "feedback-instruction";
      field.rows = 3;
      field.maxLength = 2000;
      label.htmlFor = field.id;
      instruction = field;
      box.append(label, field);
    } else {
      box.append(
        node("p", plan.base + " at " + plan.baseSha, "path"),
        node("pre", plan.summary, "diff"),
        node("pre", plan.patch, "diff"),
        node(
          "p",
          plan.conflicts.length
            ? "Conflicts to resolve: " + plan.conflicts.join(", ")
            : "Git combined these changes without text conflicts. Human review and fresh checks are still required.",
          plan.conflicts.length ? "error" : "muted",
        ),
        node(
          "p",
          "Creates a separate integration review. Existing work stays intact. No agent runs and nothing is published by this action.",
          "muted",
        ),
      );
    }
    if (job.state === "ready") {
      const action = button(
        job.kind === "comments"
          ? "Create feedback request"
          : "Create integration review",
        async () => {
          action.disabled = true;
          try {
            const result = await api("/api/feedback", {
              action: "apply",
              id: job.id,
              fingerprint: plan.fingerprint,
              keys: keys.filter((x) => x.check.checked).map((x) => x.key),
              instruction: instruction?.value,
            });
            $("feedback-dialog").close();
            $("review-dialog").close();
            feedbackTask = null;
            reviewTask = null;
            reset(result.conversation);
            await refresh();
            if (job.kind === "integration") await openReview(result.id);
            else
              notice(
                "Feedback request saved. Review and approve its run to continue.",
              );
          } finally {
            action.disabled = false;
          }
        },
        "primary",
      );
      box.append(action);
    }
  } catch (e) {
    notice(e.message);
  } finally {
    feedbackPolling = false;
  }
}
setInterval(updateFeedback, 1500);

// Scope settings use the same server-side resolver as approval and dispatch.
const settingsDialog = node("dialog");
settingsDialog.id = "settings-dialog";
settingsDialog.setAttribute("aria-labelledby", "settings-heading");
const settingsHead = node("div", undefined, "review-head");
settingsHead.append(node("h2", "Agent settings"));
settingsHead.firstChild.id = "settings-heading";
settingsHead.append(button("Close", () => settingsDialog.close()));
const settingsForm = node("form"),
  settingsContent = node("div");
settingsContent.id = "settings-content";
const settingsScope = node("select");
settingsScope.id = "settings-scope";
settingsScope.setAttribute("aria-label", "Settings scope");
for (const [value, text] of [
  ["project", "Project defaults"],
  ["project-agent", "This agent in this project"],
  ["conversation", "Conversation defaults"],
  ["conversation-agent", "This agent in this conversation"],
  ["next", "Next run only"],
]) {
  const o = node("option", text);
  o.value = value;
  settingsScope.append(o);
}
const settingsAgent = node("select");
settingsAgent.id = "settings-agent";
settingsAgent.setAttribute("aria-label", "Settings agent");
for (const [id, name] of [
  ["claude", "Claude"],
  ["codex", "Codex"],
  ["cursor", "Cursor"],
]) {
  const o = node("option", name);
  o.value = id;
  settingsAgent.append(o);
}
const settingsScopeLabel = node("label", "Apply to");
settingsScopeLabel.htmlFor = settingsScope.id;
const settingsAgentLabel = node("label", "Agent");
settingsAgentLabel.htmlFor = settingsAgent.id;
settingsForm.append(
  settingsScopeLabel,
  settingsScope,
  settingsAgentLabel,
  settingsAgent,
  settingsContent,
);
settingsDialog.append(settingsHead, settingsForm);
document.body.append(settingsDialog);
let settingsData = null,
  settingsEpoch = 0;
const plainAccess = {
  edit: "Can edit files in an isolated copy",
  read: "Read-only",
  chat: "No project access",
  blocked: "Runs disabled",
};
const plainSource = (source) =>
  source === "Installation" ? "server default" : source.toLowerCase();
const plainPlace = (text) =>
  String(text)
    .replace(/isolated worktree/gi, "isolated copy of the project")
    .replace(/worktree/gi, "project copy");
function plainDuration(ms) {
  const seconds = Math.round(ms / 1000);
  return seconds < 90
    ? seconds + " seconds"
    : Math.round(seconds / 60) + " min";
}
function plainModel(selection) {
  return (
    (selection.model === "provider"
      ? "Provider default model"
      : selection.model) +
    (selection.effort === "provider"
      ? ""
      : " · " + selection.effort + " effort")
  );
}
function executionSummary(value) {
  return `${plainPlace(value.permissions.filesystem)} · ${plainModel(value.selection)} · up to ${plainDuration(value.timeoutMs)}`;
}
function executionDetails(value) {
  const details = node("details"),
    summary = node("summary", "Details");
  const list = node("dl", undefined, "run-facts");
  const row = (term, text) => list.append(node("dt", term), node("dd", text));
  row("Files", plainPlace(value.permissions.filesystem));
  row("Network", plainPlace(value.permissions.network));
  row("Model", plainModel(value.selection) + " (requested)");
  row("Time limit", plainDuration(value.timeoutMs));
  if (value.settings?.access)
    row(
      "Most access allowed",
      (plainAccess[value.settings.access] ?? value.settings.access) +
        (value.sources?.access
          ? " · " + plainSource(value.sources.access)
          : ""),
    );
  details.append(
    summary,
    list,
    node(
      "p",
      (value.selection.reason ? value.selection.reason + " " : "") +
        "Shell, plugins and extra folders are never available.",
      "muted",
    ),
  );
  return details;
}
async function openSettings(scope) {
  settingsAgent.value = $("adapter").value;
  settingsScope.value =
    scope ?? (selected ? "conversation-agent" : "project-agent");
  for (const o of settingsScope.options)
    o.disabled = o.value.startsWith("conversation") && !selected;
  settingsDialog.showModal();
  await loadSettings();
}
settingsScope.onchange = settingsAgent.onchange = () => loadSettings();
async function loadSettings() {
  settingsData = null;
  const epoch = ++settingsEpoch;
  settingsContent.replaceChildren(node("p", "Loading settings…", "muted"));
  try {
    const agent = settingsAgent.value,
      mode = policy.adapters
        ?.find((a) => a.id === agent)
        ?.modes.includes($("mode").value)
        ? $("mode").value
        : (policy.adapters?.find((a) => a.id === agent)?.modes[0] ?? "ask");
    const value = await api("/api/settings", {
      action: "view",
      project: projectId,
      conversation: selected,
      agent,
      mode,
      prompt: $("prompt").value,
      overrides: nextRun[agent] ?? {},
    });
    if (epoch !== settingsEpoch || !settingsDialog.open) return;
    settingsData = value;
    renderSettings(value);
  } catch (e) {
    if (epoch === settingsEpoch)
      settingsContent.replaceChildren(node("p", e.message, "error"));
  }
}
function renderSettings(data) {
  const scope = settingsScope.value,
    common = ["project", "conversation"].includes(scope),
    next = scope === "next",
    source = scope.startsWith("project") ? "Project" : "Conversation",
    sourceName = source + (common ? "" : " · " + data.agent),
    values = next
      ? (nextRun[data.agent] ?? {})
      : (data.layers.find((l) => l.source === sourceName)?.values ?? {});
  settingsContent.replaceChildren();
  const field = (name, label, options, value) => {
    const l = node("label", label),
      select = node("select");
    select.name = name;
    select.id = "setting-" + name;
    l.htmlFor = select.id;
    for (const [id, text, disabled] of options) {
      const option = node("option", text);
      option.value = id;
      option.disabled = !!disabled;
      select.append(option);
    }
    select.value = value ?? "";
    settingsContent.append(l, select);
    return select;
  };
  const access = field(
    "access",
    "Environment access",
    [
      ["", "Inherit"],
      ["blocked", "Disable runs"],
      ["chat", "Chat only — no project access"],
      ["read", "Read-only project access"],
      [
        "edit",
        "Allow isolated edits within installation limits",
        !common && !data.supported?.modes.includes("edit"),
      ],
    ],
    values.access,
  );
  access.disabled = next;
  const model = field(
    "model",
    "Model",
    [
      ["", "Inherit"],
      ["auto", "Auto — agentd task routing"],
      ["provider", "Provider default"],
      ...(!common ? data.catalog.models.map((m) => [m.id, m.name]) : []),
    ],
    values.model,
  );
  const effort = field(
    "effort",
    "Reasoning effort",
    [
      ["", "Inherit"],
      ["auto", "Auto — task appropriate"],
      ["provider", "Provider default"],
    ],
    null,
  );
  const populateEffort = () => {
    const previous = effort.value || values.effort || "",
      chosen = data.catalog.models.find((m) => m.id === model.value),
      levels = common
        ? []
        : (chosen?.efforts ??
          (model.value === "provider"
            ? []
            : [...new Set(data.catalog.models.flatMap((m) => m.efforts))]));
    effort.replaceChildren();
    for (const [id, text] of [
      ["", "Inherit"],
      ["auto", "Auto — task appropriate"],
      ["provider", "Provider default"],
      ...levels.map((e) => [e, e]),
    ]) {
      const o = node("option", text);
      o.value = id;
      effort.append(o);
    }
    effort.value = Array.from(effort.options).some((o) => o.value === previous)
      ? previous
      : "provider";
  };
  populateEffort();
  model.onchange = populateEffort;
  field(
    "timeoutSeconds",
    "Maximum run time",
    [
      ["", "Inherit"],
      ["30", "30 seconds"],
      ["120", "2 minutes"],
      ["300", "5 minutes"],
      ["600", "10 minutes"],
    ],
    values.timeoutSeconds == null ? "" : String(values.timeoutSeconds),
  );
  settingsContent.append(
    node(
      "p",
      "Project → project agent → conversation → conversation agent. Later settings override earlier ones. Inherit removes this field’s override.",
      "muted",
    ),
  );
  settingsContent.append(
    node(
      "p",
      "Installation ceiling: isolated worktrees, provider-only network, file tools only. Extra host paths, shell, web, MCP and unrestricted access are not enabled. Codex remains Chat only.",
      "muted",
    ),
  );
  if (!common) {
    settingsContent.append(
      node(
        "p",
        data.catalog.source +
          (data.catalog.checkedAt
            ? " · checked " + new Date(data.catalog.checkedAt).toLocaleString()
            : ""),
        "muted",
      ),
    );
    if (data.catalog.error)
      settingsContent.append(node("p", data.catalog.error, "error"));
    const refresh = button(
      data.catalog.busy ? "Refreshing models…" : "Refresh native models",
      async () => {
        try {
          await api("/api/settings", {
            action: "refresh-models",
            project: projectId,
            conversation: selected,
            agent: data.agent,
          });
          await loadSettings();
        } catch (e) {
          notice(e.message);
        }
      },
    );
    refresh.disabled = data.catalog.busy;
    settingsContent.append(refresh);
    if (data.agent === "cursor")
      settingsContent.append(
        node(
          "p",
          "Cursor effort is controlled by its listed native model variants. Independent effort levels are unavailable.",
          "muted",
        ),
      );
  }
  if (data.error) settingsContent.append(node("p", data.error, "attention"));
  if (data.effective) {
    settingsContent.append(
      node("h3", "Current effective settings"),
      node("p", executionSummary(data.effective)),
      node("p", data.effective.selection.reason, "muted"),
    );
    for (const [key, origin] of Object.entries(data.effective.sources))
      settingsContent.append(node("p", key + ": " + origin, "muted"));
  }
  for (const running of data.active) {
    settingsContent.append(
      node(
        "p",
        "The active run keeps its previously approved settings. Stop it, then use Restart with current settings; partial edits are preserved for review.",
        "attention",
      ),
      button(
        "Stop active run",
        async () => {
          if (
            confirm(
              "Stop this run? Its worktree will be preserved. Restart with current settings will require a new approval.",
            )
          ) {
            await api("/api/action", { op: "cancel", id: running.id });
            settingsDialog.close();
            await refresh();
          }
        },
        "danger",
      ),
    );
  }
  const save = node("button", "Save settings", "primary");
  save.type = "submit";
  settingsContent.append(
    save,
    button("Reset this scope to inherited", async () => {
      if (next) {
        delete nextRun[data.agent];
        saveDraft();
        await loadSettings();
        return;
      }
      await saveSettings({});
    }),
  );
  settingsContent.append(
    node(
      "p",
      "Saving changes invalidates affected pending approvals. Running tasks are not changed. Automatic selection makes no planning request, does not enable paid overages and never retries or escalates automatically.",
      "muted",
    ),
  );
  const technical = node("details");
  technical.append(node("summary", "How defaults and permissions work"));
  for (const child of [...settingsContent.children]) {
    if (child.tagName === "P" && child.classList.contains("muted"))
      technical.append(child);
  }
  settingsContent.append(technical);
  if (next) {
    access.hidden = true;
    settingsContent.querySelector('label[for="setting-access"]').hidden = true;
  }
}
async function saveSettings(values, confirmed = false) {
  const data = settingsData,
    scope = settingsScope.value,
    common = ["project", "conversation"].includes(scope);
  if (!data) return;
  if (scope === "next") {
    nextRun[data.agent] = values;
    saveDraft();
    settingsDialog.close();
    notice(
      "Next-run choices saved for " +
        data.agent +
        ". Review the final selection before approving.",
    );
    return;
  }
  const source =
      (scope.startsWith("project") ? "Project" : "Conversation") +
      (common ? "" : " · " + data.agent),
    before = data.layers.find((l) => l.source === source)?.values ?? {};
  if (!confirmed) {
    $("settings-confirm")?.remove();
    const review = node("div", undefined, "attention");
    review.id = "settings-confirm";
    review.append(
      node("h3", "Apply settings to " + source + "?"),
      node(
        "p",
        Object.entries(values)
          .map(([key, value]) => key + ": " + value)
          .join(" · ") || "Reset every field in this scope to inherited.",
      ),
      node(
        "p",
        "Affected waiting or queued runs will require fresh approval. Active runs retain their current permissions.",
      ),
      button(
        "Confirm settings change",
        () => saveSettings(values, true),
        "primary",
      ),
      button("Keep editing", () => review.remove()),
    );
    settingsContent.append(review);
    review.scrollIntoView({ block: "nearest" });
    return;
  }
  try {
    await api("/api/settings", {
      action: "save",
      project: projectId,
      conversation: selected,
      agent: data.agent,
      scope: scope.startsWith("project") ? "project" : "conversation",
      agentScope: common ? "*" : data.agent,
      values,
      previous: JSON.stringify(before),
      mode: data.effective?.mode ?? "ask",
      prompt: $("prompt").value,
    });
    await loadSettings();
    fingerprint = "";
    await refresh();
    notice("Settings saved. Review updated pending runs before approving.");
  } catch (e) {
    notice(e.message);
  }
}
settingsForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!settingsData) return;
  const values = {};
  for (const name of ["access", "model", "effort", "timeoutSeconds"]) {
    const input = settingsForm.elements.namedItem(name);
    if (input.disabled || !input.value) continue;
    values[name] =
      name === "timeoutSeconds" ? Number(input.value) : input.value;
  }
  await saveSettings(values);
};
setInterval(() => {
  if (settingsDialog.open && settingsData?.catalog.busy) void loadSettings();
}, 1500);

// UI composition preserves the existing action handlers and approval payloads.
setupShell();
$("run-options").onclick = () => openSettings("next");
$("defaults-menu").onclick = () =>
  openSettings(selected ? "conversation-agent" : "project-agent");
$("project-defaults").onclick = () => openSettings("project-agent");
$("stop-current").onclick = async () => {
  if (!latest) return;
  try {
    await api("/api/action", { op: "cancel", id: latest.id });
    await refresh();
  } catch (error) {
    notice(error.message);
  }
};
function openPreferences() {
  if (!$("preferences-dialog").open) $("preferences-dialog").showModal();
  void loadAccounts();
}
$("preferences-menu").onclick = openPreferences;
// Settings hands over to the focused editors instead of stacking modals.
$("github-settings").onclick = () => {
  $("preferences-dialog").close();
  $("github-open").click();
};
$("settings-defaults").onclick = () => {
  $("preferences-dialog").close();
  openSettings("project-agent");
};
accountDialog.addEventListener("close", () => {
  if ($("preferences-dialog").open) void loadAccounts(false);
});
const projectSettingsAction = $("project-menu").onclick;
$("project-menu").onclick = () => {
  $("project-info").hidden = true;
  projectSettingsAction();
  $("project-settings-dialog").showModal();
};
$("project-settings-close").onclick = () =>
  $("project-settings-dialog").close();
