// Local-folder import dialog: preview rendering, approval invalidation and job states.
const caseLabels = {
  existing_git:
    "Existing Git repository: registered in place, no files or Git state change",
  empty: "Empty folder: Git is initialized and AgentD handover files are committed",
  non_git: "Folder without Git: Git is initialized and the listed files are committed",
};
const stateLabels = {
  running: "In progress",
  succeeded: "Registered",
  failed: "Failed. AgentD changes were rolled back",
  cancelled: "Cancelled. AgentD changes were rolled back",
  rolled_back: "Rolled back",
  recovery_required: "Needs recovery",
};
const phaseLabels = {
  approved: "Approved and re-checked",
  git_initialized: "Git initialized",
  handover_created: "Handover files created",
  committed: "Initial commit created",
  registered: "Project registered",
};

function el(doc, tag, text, cls) {
  const node = doc.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (cls) node.className = cls;
  return node;
}
function section(doc, title, items, render, { empty, truncated, total, cls } = {}) {
  const wrap = el(doc, "section", undefined, cls);
  wrap.setAttribute("aria-label", title);
  wrap.append(el(doc, "h3", `${title} (${total ?? items.length})`));
  if (!items.length) {
    wrap.append(el(doc, "p", empty ?? "None.", "muted"));
    return wrap;
  }
  const list = el(doc, "ul");
  for (const item of items) {
    const li = el(doc, "li");
    li.append(...[render(item)].flat());
    list.append(li);
  }
  wrap.append(list);
  if (truncated)
    wrap.append(el(doc, "p", `Showing the first ${items.length} of ${total}.`, "muted"));
  return wrap;
}

export function localFolderRootsText(roots) {
  if (!roots?.length)
    return "No folder roots are allowlisted. An administrator must configure local project roots before a folder can be used.";
  return `Folders must be under an allowed root on the AgentD server: ${roots.map((r) => r.path).join(", ")}.`;
}

/** Render every fact the approval binds: the operator approves exactly what is shown. */
export function renderLocalFolderPreview(doc, box, preview) {
  if (!preview) {
    box.replaceChildren();
    return;
  }
  const path = el(doc, "p");
  path.append("Folder: ", el(doc, "code", preview.canonicalPath));
  const facts = [
    path,
    el(doc, "p", caseLabels[preview.case] ?? preview.case),
    el(
      doc,
      "p",
      `Stack: ${preview.stack?.length ? preview.stack.join(", ") : "none detected"}`,
    ),
  ];
  if (preview.case === "existing_git")
    facts.push(
      el(
        doc,
        "p",
        `Branch: ${preview.branch ?? "detached"}${preview.dirty ? " · has uncommitted local changes, which stay untouched" : ""}`,
      ),
    );
  const blocking = [];
  if (preview.blocked) {
    const alert = el(doc, "div", undefined, "error");
    alert.setAttribute("role", "alert");
    alert.append(
      el(
        doc,
        "p",
        "Approval is blocked. Resolve these files on the server, then review again.",
      ),
    );
    if (preview.findings.total)
      alert.append(
        section(
          doc,
          "Sensitive findings",
          preview.findings.items,
          (f) => [el(doc, "code", f.path), ` — ${f.reasons.join(", ")}`],
          preview.findings,
        ),
      );
    if (preview.refused.total)
      alert.append(
        section(
          doc,
          "Refused files",
          preview.refused.items,
          (r) => [el(doc, "code", r.path), ` — ${r.reason}`],
          preview.refused,
        ),
      );
    blocking.push(alert);
  }
  const files =
    preview.case === "existing_git"
      ? []
      : [
          section(
            doc,
            "Files to commit",
            preview.files.items,
            (f) => [el(doc, "code", f.path), f.mode === "100755" ? " (executable)" : ""],
            {
              ...preview.files,
              empty: "No existing files; only handover files are committed.",
            },
          ),
        ];
  const ignored = section(
    doc,
    "Ignored by .gitignore",
    preview.ignored.groups,
    (g) => [el(doc, "code", g.entry), g.count > 1 ? ` (${g.count} entries)` : ""],
    { total: preview.ignored.total, empty: "Nothing is ignored." },
  );
  if (preview.ignored.sensitive)
    ignored.append(
      el(
        doc,
        "p",
        `${preview.ignored.sensitive} ignored entries look sensitive; they stay ignored and are never committed.`,
        "muted",
      ),
    );
  const handover = section(
    doc,
    "Handover files to create",
    preview.handover,
    (h) => {
      const details = el(doc, "details");
      const summary = el(doc, "summary");
      summary.append(el(doc, "code", h.path));
      details.append(summary, el(doc, "pre", h.content));
      return details;
    },
    {
      empty:
        preview.case === "existing_git"
          ? "None. Existing repositories are registered without adding files."
          : "None. Existing handover files are kept.",
    },
  );
  const kept = preview.keptHandover?.length
    ? [
        section(doc, "Existing handover files kept", preview.keptHandover, (p) =>
          el(doc, "code", p),
        ),
      ]
    : [];
  const operations = el(doc, "section");
  operations.setAttribute("aria-label", "Exact operations");
  const steps = el(doc, "ol");
  for (const op of preview.gitOperations) steps.append(el(doc, "li", op));
  operations.append(el(doc, "h3", "Exact operations"), steps);
  operations.append(
    el(
      doc,
      "p",
      preview.willCreateInitialCommit
        ? "AgentD creates one initial commit containing exactly the files listed above."
        : "No commit is created.",
    ),
  );
  box.replaceChildren(
    ...facts,
    ...blocking,
    ...files,
    ignored,
    handover,
    ...kept,
    operations,
  );
}

export function renderLocalFolderJobs(doc, box, jobs, actions) {
  if (!jobs?.length) {
    box.replaceChildren();
    return;
  }
  const list = el(doc, "ul");
  for (const job of jobs) {
    const item = el(doc, "li");
    item.dataset.job = job.id;
    item.append(
      el(
        doc,
        "p",
        `${job.name} · ${job.pathLabel} — ${stateLabels[job.state] ?? job.state}`,
      ),
    );
    const phases = el(doc, "ol");
    phases.setAttribute("aria-label", `Progress for ${job.name}`);
    for (const p of job.phases) {
      const step = el(
        doc,
        "li",
        `${p.done ? "✓" : "○"} ${phaseLabels[p.phase] ?? p.phase}`,
      );
      if (p.done) step.dataset.done = "true";
      phases.append(step);
    }
    item.append(phases);
    if (job.error)
      item.append(el(doc, "p", job.error, job.needsRecovery ? "error" : "muted"));
    const buttons = el(doc, "div", undefined, "actions");
    if (job.canCancel) {
      const cancel = el(doc, "button", "Cancel import");
      cancel.type = "button";
      cancel.onclick = () => actions.cancel(job.id);
      buttons.append(cancel);
    }
    if (job.needsRecovery) {
      const resume = el(doc, "button", "Resume import");
      resume.type = "button";
      resume.onclick = () => actions.recover(job.id, "resume");
      const rollback = el(doc, "button", "Roll back AgentD changes");
      rollback.type = "button";
      rollback.onclick = () => actions.recover(job.id, "rollback");
      buttons.append(resume, rollback);
    }
    if (buttons.childElementCount) item.append(buttons);
    list.append(item);
  }
  box.replaceChildren(el(doc, "h3", "Recent local folder imports"), list);
}

/** Dialog state machine. Any edit after a preview discards it, so approval always
 * matches the inputs on screen. `schedule` is injectable for deterministic tests. */
export function localFolderController({
  doc,
  elements: E,
  api,
  notice,
  onRegistered,
  schedule = (fn, ms) => setTimeout(fn, ms),
}) {
  let preview = null,
    watching = null,
    polling = false,
    generation = 0;
  const render = () => {
    renderLocalFolderPreview(doc, E.preview, preview);
    E.approve.hidden = !preview;
    E.approve.disabled = !preview || preview.blocked;
  };
  const invalidate = () => {
    generation++;
    if (!preview) return;
    preview = null;
    render();
    api("/api/local-folder", { action: "cancel" }).catch(() => {});
  };
  for (const input of [E.name, E.path]) input.addEventListener("input", invalidate);
  const actions = {
    cancel: async (job) => {
      try {
        await api("/api/local-folder", { action: "cancelJob", job });
        await load();
      } catch (error) {
        notice(error.message);
      }
    },
    recover: async (job, recovery) => {
      if (!E.key.value) {
        notice("Enter your current access key to resume or roll back.");
        E.key.focus?.();
        return;
      }
      try {
        await api("/api/local-folder", {
          action: "recover",
          job,
          recovery,
          currentKey: E.key.value,
        });
        E.key.value = "";
        if (recovery === "resume") watching = job;
        await load();
      } catch (error) {
        notice(error.message);
      }
    },
  };
  function poll() {
    if (polling) return;
    polling = true;
    schedule(async () => {
      polling = false;
      try {
        await load();
      } catch (error) {
        notice(error.message);
      }
    }, 1000);
  }
  async function load() {
    const data = await api("/api/local-folder");
    E.roots.textContent = localFolderRootsText(data.roots);
    renderLocalFolderJobs(doc, E.jobs, data.jobs, actions);
    const watched = watching && data.jobs.find((j) => j.id === watching);
    if (watched && !watched.running) {
      watching = null;
      if (watched.state === "succeeded") onRegistered(watched);
      else notice(watched.error ?? stateLabels[watched.state]);
    }
    if (data.jobs.some((j) => j.running)) poll();
    return data;
  }
  async function review() {
    const started = ++generation;
    E.review.disabled = true;
    try {
      const result = await api("/api/local-folder", {
        action: "preview",
        name: E.name.value,
        path: E.path.value,
      });
      // An edit while the preview was loading makes this result stale.
      if (started !== generation) return;
      preview = result;
      render();
      notice(
        preview.blocked
          ? "Approval is blocked. Resolve the listed files, then review again."
          : "Check every listed file and operation, then approve with your access key.",
      );
    } catch (error) {
      if (started !== generation) return;
      preview = null;
      render();
      notice(error.message);
    } finally {
      E.review.disabled = false;
    }
  }
  async function approve() {
    if (!preview || preview.blocked) {
      notice("Review the folder before approving.");
      return;
    }
    const { fingerprint } = preview;
    E.approve.disabled = true;
    try {
      const job = await api("/api/local-folder", {
        action: "approve",
        fingerprint,
        currentKey: E.key.value,
      });
      E.key.value = "";
      preview = null;
      render();
      watching = job.id;
      await load();
    } catch (error) {
      notice(error.message);
      render();
    }
  }
  function reset() {
    generation++;
    preview = null;
    watching = null;
    render();
  }
  return {
    load,
    review,
    approve,
    invalidate,
    reset,
    state: () => ({ preview, watching }),
  };
}
