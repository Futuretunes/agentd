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

Implemented and installed in v0.16.0 (70 deployment tests passed): snapshot-preserving revision requests before committing and separately approved forward updates to existing draft PRs in the same conversation.

Implemented and installed in v0.17.0 (77 deployment tests passed): selected GitHub review-comment import and isolated base integration with conflict review, fresh checks and separately approved forward publication. See [GitHub feedback and conflicts](github-feedback.md).

High-priority follow-up:

- Implemented and installed in v0.11.0; native renewal and both worker modes verified by the operator: durable native Claude/Codex credential renewal, trusted rotation recovery, access-only worker snapshots and Operations guidance. See [credential renewal](credential-renewal.md). GUI reconnect remains necessary for revoked or irrecoverable grants.
- Implemented and installed in v0.10.0: **Codex Chat only**, text Q&A through the native ChatGPT login, with no advertised tools and no repository mounted. The pinned CLI rejects injected execution calls; its read-only policy rejects patches. See [Chat only](codex-chat.md). Native Ask and Edit remain disabled for Codex.
- Restore Codex availability only through a validated solution compatible with the host's namespace restrictions. No inner-sandbox bypass.

## Candidate 0.20.0 progress

Implemented, not installed: task desk UI/UX redesign and R4 exact-tree checks with legacy check invalidation. R11 has a non-skipping Linux CI job; protected-branch enforcement remains. Final candidate Linux validation: 99/99, no skips. See [handover](handovers/2026-09-28-snapshot-checks.md). Next engineering work: release-baseline decision, tracked reproducible deployment/task-schema migration and remaining backend reviewability. Actual-phone acceptance and other open UX/engineering findings remain.

## Stabilization gate after independent review — 2026-09-28

Claude's [review](reviews/2026-09-28-claude-review.md) and Codex's [verified response](reviews/2026-09-28-claude-review-response.md) supersede the next-feature recommendation below. The review and response themselves did not fix the application; candidate implementation progress is recorded above. Remaining findings stay open. Do not treat a green test suite as evidence covering the demonstrated omitted cases.

1. **R1 — Reviewed release baseline:** pause feature-stack growth; operator chooses merge/consolidation, then tag a reviewed and validated baseline. No automatic merges.
2. **R4/R11 — Exact-snapshot checks and mandatory Linux isolation CI:** highest-priority corrective implementation. Ignored files must not make an otherwise failing reviewed snapshot pass; required CI must execute real boundaries without skips.
3. **R2/R3/R9 — Reviewability and reproducible releases:** standalone mechanical formatting, explicit operation compatibility, small module extractions, tracked parameterized install/update, drift detection and versioned transactional task-schema migrations.
4. **R5/R6/R7/R8/R12/R13 — Boundary and resource work:** separate gateway identity/socket authority, deliberate resource budgets and safe retention, verified sandbox hardening, narrower GitHub authorization, unified Git policy and shared sensitive-file/content checks.
5. **R10/R14/R15/R16/R17/R18/R19 — Reliability and operator clarity:** asynchronous/idempotent mutations, structured binary/large-diff handling, controlled follow-up context, visible native limits/version compatibility, safe errors and actor-bound audit coverage.

Private operator observations O1–O7 are addressed in public-safe terms in the response. Protected-file contents and other accounts' privileges were not independently inspected; do not promote those observations to verified facts. Resolve the gates above before resuming ntfy and other feature work.

## Operator priority update — 2026-09-28

The operator explicitly requested the UI redesign first, then the backlog. Candidate 0.20.0 now implements the core layout, navigation, safe answer presentation, file review and responsive foundations. See [implementation handover](handovers/2026-09-28-task-desk-redesign.md). Not installed yet; actual-phone and full accessibility acceptance remain. Next corrective implementation is R4/R11; no main merge or check-policy waiver was authorized.

## UX review incorporated — 2026-09-28

Claude's [UX review](reviews/2026-09-28-claude-ux-review.md) is assessed in the [U1–U19 response](reviews/2026-09-28-claude-ux-review-response.md). The [task desk UX backlog](design/ux-backlog.md) defines dependencies and acceptance criteria. The assessment below is the original plan; see the candidate implementation status above. Claude’s [rejoinder](reviews/2026-09-28-claude-ux-rejoinder.md) accepts the corrections and order; the subsequent handover records operator approval of the prototype visual direction. Explicit follow-ups include truthful New project prerequisites and one-click raw logs with downloads.

After the immediate R4/R11 correction and reviewable release baseline, prioritize:

1. **UX-1 + UX-4 foundations:** readable safe answers, accurate states, visible errors, simple approvals and accessible shared controls.
2. **UX-2:** conversation-first navigation, unified composer choices and predictable project/account/settings homes.
3. **UX-3:** progress and guided file review/check/commit/publication, preserving all approval and snapshot guarantees.
4. **UX-4 completion + UX-5:** real-phone keyboard/drawer/sheet acceptance, light/dark consistency and remaining polish. Accessibility is tested throughout.

**UX-0:** clarify unsupported check workflows now; design broader check profiles. Allowing commits without checks is a separate operator policy decision and remains unapproved. The prototype is a visual proposal, not production code. Complete this usability work before adding more panels/features such as ntfy, while respecting the engineering stabilization gate. Contextual status and approval evidence remain visible even when editing controls are consolidated.

## Prioritized backlog

Order agreed with the operator on 2026-09-28: finish the GitHub workflow, integrate Cursor CLI, then deliver configurable environment permissions and economical model/effort selection. Permission-policy design may begin during adapter work to avoid incompatible implementations. The stabilization gate above now takes precedence. The list retains completed milestones and remaining feature scope; it is not a release-date commitment.

1. **Finish the GitHub review/publishing workflow.** Verify the first live approved draft PR; v0.16 implements revision requests before committing and updates to existing draft PRs. v0.17 implements selected review-comment import and safe base/conflict integration. Remaining: live operator acceptance, broader conflict types, optional ongoing review synchronization, separately approved PR merge operations and fork workflows. Preserve exact-content checks and explicit publication approval.
2. **Cursor CLI integration.** Implemented and installed in v0.18.0 (85 deployment tests passed); operator login/model acceptance remains: pinned official CLI, native browser login/reconnect/logout, normalized account status, ACP Ask/Edit, scoped file approvals and access-only credentials. Native startup/login and isolated boundaries verified without a model request. Automatic subscription renewal and reliable usage limits are not exposed by the tested CLI; reconnect is explicit. Images, shell, web, MCP, subagents and unstructured delete requests remain unavailable. See [Cursor integration](cursor.md). Follow-up: full native prompt/edit acceptance, provider-supported renewal and limit reporting. Model selection is installed in v0.19.0; live selected-model acceptance remains.
3. **Agent settings: environment permissions and model/effort selection.** Implemented and installed in v0.19.0 (91 deployment tests passed): inherited Blocked/Chat/Read/Edit profiles within installation limits, model/effort selection, runtime limits, next-run overrides, approval snapshots and preservation of partial edits on restart. Broader shell/network/host-path policies remain future work. Original scope: GUI project defaults, conversation overrides and per-agent CLI settings, changeable at any time. Isolated worktrees remain the default. Show effective filesystem, execution, network and tool permissions and their inheritance before approval. Broader access requires explicit scoped consent; running jobs need a clear stop/restart transition rather than an unnoticed permission change. See [environment permission design requirements](environment-permissions.md). Add automatic task-appropriate model/effort selection, visible reasons and manual overrides per project, conversation and CLI; prefer the least costly capable choice, with bounded escalation and no invented usage estimates. See [model selection requirements](model-selection.md).
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
