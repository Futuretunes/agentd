# Roadmap

Implemented: project selection and creation, persistent conversations, serial task queue, approval gate, Codex and Claude CLI execution, detached worktrees, mobile text/images, cancellation, SQLite persistence, basic metrics, and the hardened worker profile with per-adapter policy and restricted provider networking.

Also implemented in v0.6.0: a shared native adapter contract, executable availability discovery, and an Agents panel with explicit unavailable reasons. Discovery does not authenticate or start model work.

Implemented in v0.7.0: a read-only Operations Center for desktop and phone. It summarizes service health, queue and task states, recent failures, pending reviews, adapter availability, and normalized native account sign-in state. Provider usage is shown as unavailable unless a native interface can report it reliably. Account checks are cached and their raw output, identities, executable paths, prompts, logs, and worktree paths are excluded from the Operations response.

## Core product requirement: terminal-free operation

Implemented in v0.8.0: guided native Claude and Codex account login, reconnect, sign-out and immediate status refresh in Operations. Login uses a temporary profile, preserves previous credentials on failure/cancellation, and excludes concurrent worker execution. Live Claude GUI reconnection was verified by the operator on 2026-09-28. Codex login startup is tested; its full browser consent still needs operator validation. See [account setup](accounts.md).

Implemented in v0.9.0 (installed; GUI acceptance pending): safe GUI retry of the latest failed, stopped, timed-out or interrupted run, with preserved inputs/revision, a fresh worktree and fresh approval. Duplicate requests reuse the same attempt, and partial edits require review first. See [task recovery](task-recovery.md).

The eventual product must let the operator manage everything through the desktop/mobile GUI, without SSH, shell commands, manual file edits, or copying installer output into chat. This is a product acceptance requirement, not just a visual redesign. Current terminal-based administration is temporary.

- **Credits and limits:** show each provider's available usage/credits, reset times, account status and approaching-limit warnings where supported. Distinguish subscription limits from metered balances. Show unavailable or stale information honestly; never invent a balance. Explain when limits block a task and provide a clear next action.
- **Current tasks:** the read-only overview is implemented. Add progress, results, logs, checks, changes, approvals, cancellation and supported retry/resume controls to the GUI.
- **Accounts:** guided Claude/Codex sign-in, sign-out, account selection and reauthentication using supported native/browser flows. Explain expired sessions and verify success. Keep passwords, authorization codes and tokens out of conversations and logs; preserve human control over sign-in and permissions.
- **Projects and operations:** create/import projects, configure supported agents and integrations, review/commit/publish approved changes, install updates, monitor services, and manage backups/restores through guided GUI workflows.
- **Foolproof recovery:** plain-language errors, sensible defaults, disabled actions with explanations, actionable prerequisites and clear success/failure states. Prevent duplicate submissions and accidental destructive actions. Preserve work across failures and offer safe rollback/retry paths instead of terminal instructions.
- **Security stays mandatory:** GUI convenience must not bypass worker isolation, grant agents sudo, expose credentials, or remove approval gates. Administrative actions need a narrowly scoped, authenticated management boundary.

Acceptance: a nontechnical operator can complete the supported setup, sign-in, project/task lifecycle, usage monitoring, update and recovery journeys from the GUI alone. Validate these journeys on a phone as well as desktop, including expired logins, exhausted limits, unavailable providers, interrupted runs and failed updates. External provider availability and manual consent must be explained rather than hidden.

Implemented and installed in v0.12.0: [workspace history and recovery](workspace-history.md) adds searchable conversation history with older-turn pagination, reversible project/conversation archiving, run timelines and authenticated output downloads, and browser-tab draft recovery. Desktop and phone-width flows were checked with fixtures; no model work was submitted.

Implemented and installed in v0.13.0: [GitHub import and safe updates](repositories.md), including branch discovery, guided native GitHub device sign-in for private repositories, background progress/cancellation, and clean fast-forward updates. Public clone and native login startup verified on the VM; the operator confirmed the import GUI works; private-repository consent remains operator-controlled.

Implemented and installed in v0.14.0: GUI npm dependency/check setup from Project details and edit reviews. Explicit manifest-bound preparation approval, registry-only credential-free downloads with install scripts disabled, cancellation/recovery, and offline exact-content checks. See [reviewable editing](editing.md).

Implemented and installed in v0.15.0 (66 deployment tests passed): exact-commit GitHub publication previews, separate upload approval, dedicated branches, draft PR creation and recovery after uncertain GitHub responses. See [publishing](publishing.md). Live publication remains operator-approved.

Implemented in v0.16.0, pending installation: snapshot-preserving revision requests before committing and separately approved forward updates to existing draft PRs in the same conversation.

High-priority follow-up:

- Implemented and installed in v0.11.0; native renewal and both worker modes verified by the operator: durable native Claude/Codex credential renewal, trusted rotation recovery, access-only worker snapshots and Operations guidance. See [credential renewal](credential-renewal.md). GUI reconnect remains necessary for revoked or irrecoverable grants.
- Implemented and installed in v0.10.0: **Codex Chat only**, text Q&A through the native ChatGPT login, with no advertised tools and no repository mounted. The pinned CLI rejects injected execution calls; its read-only policy rejects patches. See [Chat only](codex-chat.md). Native Ask and Edit remain disabled for Codex.
- Restore Codex availability only through a validated solution compatible with the host's namespace restrictions. No inner-sandbox bypass.

## Prioritized backlog

Order agreed with the operator on 2026-09-28: finish the GitHub workflow, integrate Cursor CLI, then deliver configurable environment permissions and economical model/effort selection. Permission-policy design may begin during adapter work to avoid incompatible implementations. These are planned milestones, not installed capabilities or release-date commitments.

1. **Finish the GitHub review/publishing workflow.** Verify the first live approved draft PR; v0.16 implements revision requests before committing and updates to existing draft PRs. Remaining: review-comment synchronization and GUI handling of advanced bases/conflicts. Design separately approved merge operations and fork workflows. Preserve exact-content checks and explicit publication approval.
2. **Cursor CLI integration.** Use the official native CLI and Cursor account/subscription login. Evaluate ACP for prompts, streamed results, cancellation and permission requests. Validate login/renewal, subscription-limit handling, model selection, and sandbox/network compatibility before enabling Ask/Edit. Expose setup and status through the GUI; no separate provider API key requirement or automatic activation of paid overages.
3. **Agent settings: environment permissions and model/effort selection.** GUI project defaults, conversation overrides and per-agent CLI settings, changeable at any time. Isolated worktrees remain the default. Show effective filesystem, execution, network and tool permissions and their inheritance before approval. Broader access requires explicit scoped consent; running jobs need a clear stop/restart transition rather than an unnoticed permission change. See [environment permission design requirements](environment-permissions.md). Add automatic task-appropriate model/effort selection, visible reasons and manual overrides per project, conversation and CLI; prefer the least costly capable choice, with bounded escalation and no invented usage estimates. See [model selection requirements](model-selection.md).
4. **Codex repository access.** Validate Ask/Edit compatibility with host namespace restrictions without bypassing the inner sandbox. User-selectable policies do not turn unsupported sandbox combinations into supported ones.
5. **Mobile notifications.** ntfy approval requests, completion/failure alerts and authenticated links to the relevant work.
6. **GUI administration.** Guided agentd/native CLI updates, service controls, diagnostics and rollback through a narrowly scoped management interface.
7. **GUI backup and restore.** Recovery verification, migrations and credential-safe restoration.
8. **Credits and limits.** Provider-supported usage, reset times, freshness, warnings and actionable limit failures; honest unavailable states where no reliable interface exists.
9. **Task progress and validation.** Structured results, richer event streams and task-specific completion evidence.
10. **Interrupt and resume.** Durable interrupts and supported native-session resume, distinct from starting a fresh retry.
11. **Broader check profiles.** Monorepos, other languages/package managers, private registries and narrowly reviewed build steps.
12. **Project-level orchestration.** Plans, dependent tasks, agent handoffs and controlled parallel scheduling with resource and approval policies. The current scheduler is serial.
13. **Storage lifecycle.** Retention/cleanup for worktrees, logs, images, prepared dependencies and backups, with active-work protection and storage visibility.
14. **Accounts and adapters.** Supported account selection, multiple GitHub identities and additional future agent adapters.
15. **Additional isolation.** Further worker credential separation, CPU/memory/disk limits and stronger boundaries beyond the single-operator profile.
16. **Monitoring.** Prometheus/Grafana dashboards, Loki/Alloy log integration and Alertmanager alerts.
17. **Infrastructure integrations.** Vault, n8n and MCP with explicit permission boundaries.
18. **Remote access.** VPN/reverse proxy, then multi-user authentication and authorization where needed.
19. **Recorded voice.** Optional audio capture/transcription with an explicit privacy and cost model; keyboard dictation already works.
20. **Open-source release operations.** Repeatable releases, upgrade compatibility, migration and deployment automation.

Every milestone includes desktop/phone acceptance, actionable failures, cancellation/recovery where relevant, and preservation of the approval model. Full Codex GUI consent, private GitHub sign-in/import, task retry acceptance and the first live publication still need recorded operator verification.

A feature listed here is not a promise that the current release supports it.
