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

## Installed 0.20.0 progress

Implemented and installed (read-only health/service confirmation, 2026-09-28): task desk UI/UX redesign and R4 exact-tree checks with legacy check invalidation. R11 has a non-skipping Linux CI job; protected-branch enforcement remains. Final candidate Linux validation: 99/99, no skips. See [handover](handovers/2026-09-28-snapshot-checks.md). Next engineering work: release-baseline decision, tracked reproducible deployment/task-schema migration and remaining backend reviewability. Actual-phone acceptance and other open UX/engineering findings remain.

## Installed 0.21.2

Claude combined the UI fixes with managed deployment and installed 0.21.1 (`be16009`); independent health/manifest verification confirms it. The separate 0.20.1 and duplicate integration paths are superseded. A follow-up installer review reproduced acceptance of unexpected special files and external dependency-root links. Installed 0.21.2 rejects those, hard links and changed manifests before privileged ownership changes; 107/107 Linux tests and 14 deployment fixtures passed. Initial deployment refused a valid manifest file due to a loop-variable collision; a full-flow regression now covers the correction. The operator completed the corrected installation; independent health/manifest verification confirms 0.21.2 at `add2d08`, task schema 1 and both services active. See [handover](handovers/2026-09-28-candidate-validation.md). R5 gateway identity/socket separation remains next, after this installer correction.

## Installed 0.21.0 — release and schema foundations

Administrator acceptance found a gateway/runner compatibility-check mismatch (`LockPersonality`); corrected without changing either unit. A second compatibility correction aligns omitted mobile JSON keys with runtime defaults. The operator completed deployment; independent health confirms 0.21.0, task schema 1 and both services active.

Implemented, tested (105/105 Linux tests, zero skips) and installed: R9 versioned transactional task migrations and refusal of future task schemas; R3 exact-commit deterministic source packages, manifest verification, tracked parameterized application update, effective configuration fingerprints and ordinary-failure rollback. See [managed updates](managed-updates.md) and [handover](handovers/2026-09-28-managed-deployment.md). Fresh provisioning, automatic power-loss recovery, signed release provenance, managed configuration reconciliation and GUI administration remain open. No project branches are advanced by the updater. Next: reviewed release baseline/protected CI, then boundary and resource work; R2 backend decomposition remains.

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

## R5 installed — 0.22.0

Separate web UID, restricted runner socket, runner-owned attachments and journalled identity migration are implemented; see [handover](handovers/2026-09-28-separate-web-gateway.md). Exact archive passed all 112 Linux tests with zero skips; CI Node 24/26 and required isolation passed. Draft #25 and the operator installer are staged. The operator installed 0.22.0 and the live UID/mount-namespace probe passed. Independent verification confirms the expected release and separate gateway identity, with no writable paths or runner-group membership. Post-install phone acceptance remains pending. Preserve actual approval/security boundaries and distinguish this source milestone from deployment. After acceptance, R6 resource budgets and safe retention are next; existing R1 release-baseline decisions remain open.

## R6 candidate — resources and retention

Implemented on `feat/resource-retention`: bounded task/check output, disk reserve and tracked-checkout limits, monitored worktree growth, approval-gated archived-task cleanup, provenance-based managed backup retention and explicit service CPU/memory/process profile. See [handover](handovers/2026-09-28-resource-retention.md). Not installed; exact archive passed 118/118 Linux tests, zero skips, and all CI jobs. Draft #26 is ready for Claude review. Still open: per-worker cgroups, hard filesystem quotas, attachment/dependency retention, cleanup crash reconciliation and privileged GUI administration. Continue R7 next, per the operator's overnight backlog instruction.

## R7 candidate — explicit worker hardening

Implemented shared explicit namespace/capability policy and fail-closed libseccomp launch for workers/checks/renewal/dependency preparation. Exact archive `de1db8a` passed 120/120 Linux tests with zero skips; CI passed, draft #27 open. Not installed. See [handover](handovers/2026-09-28-worker-hardening.md). No host relaxation or Codex tool-policy expansion. Next overnight items: R12 shared Git policy, then R13 sensitive-data policy. R8 authentication redesign still needs a reviewed consent design.

## R12 candidate — shared Git subprocess policy

Implemented on `feat/shared-git-policy`: minimal explicit environment, disabled hooks/global configuration/implicit transport, and rejection of custom executable drivers, includes and repository transport overrides. Covers all runtime Git paths, retaining explicit temporary-index and GitHub network authority. Exact archive passed 122/122 Linux tests with zero skips; CI passed, draft #28 open. Not installed. See [handover](handovers/2026-09-28-git-policy.md). Next R13 shared sensitive-data checks.

## R13 / R14 candidate — sensitive data and binary classification

Shared credential filename/content policy now covers exact review blobs, outgoing commit history, commit messages and PR text. Suspect/unscannable review patches are withheld; GUI commit/publication remain blocked. Binary detection uses Git numstat metadata instead of a phrase in the diff. Full large-diff/binary review workflows remain deferred. Exact archive `3af7da7` passed 125/125 Linux tests, zero skips; CI passed, draft #29 open. Not installed. See [handover](handovers/2026-09-28-sensitive-data.md).

## R15 candidate — bounded oversized reviews

Git output overflow now becomes a fixed error without raw output; review converts it to an unapprovable truncated result. Patch generation is capped at 180 KB before buffering a full diff. Real multi-megabyte reproduction passes. Exact archive passed 126/126 Linux tests with zero skips; CI passed, draft #30 open. Not installed. See [handover](handovers/2026-09-28-bounded-review.md). R14 large-file paginated review remains future work.

## R19 candidate — missing mutation audits and session attribution

Browser mutations now require a gateway-supplied owner; audit records use a domain-separated session pseudonym and distinguish browser/local/system contexts. Missing project creation/rename, conversation rename, discard and task creation records are added without names or prompts. Exact archive `ed949de` passed 127/127 Linux tests with zero skips; CI passed, draft #31 open. Not installed. See [handover](handovers/2026-09-28-session-audit.md). User accounts, tamper-evident external audit storage and a GUI audit viewer remain separate work.

## R17 candidate — visible native compatibility and limits

Operations exposes normalized installed CLI version, expected tested version, freshness/mismatch/unavailable state and fixed native turn/protocol limits. Approval snapshots include native limits; version constants are shared across selection, catalog, renewal and wrappers. Reviewed native-update procedure documented. Exact archive `c11b35f` passed 128/128 Linux tests, zero skips; CI passed, draft #32 open. Not installed. Structured provider stop-reason reporting and provider quota/credit discovery remain unavailable/deferred. See [handover](handovers/2026-09-28-native-limits.md).

## R18 candidate — browser-safe errors

Runner gateway and HTTPS boundaries now preserve reviewed fixed error guidance and normalize unknown exceptions plus stored task/job/check error metadata. No raw subprocess buffers or dynamic exception text are promoted to public error messages. Private administrator responses and authorized user content/logs remain separate. Exact archive `b003248` passed 130/130 Linux tests with zero skips; CI passed. Not installed. See [handover](handovers/2026-09-28-public-errors.md).

## R16 candidate — explicit, approval-bound follow-up context

Added inherited and next-run previous-answer/no-context settings, visible in run details. Only completed saved answers and a bounded question excerpt are eligible; legacy raw logs, diagnostics, failed-run output and unsafe linked files are excluded. JSON-encoded content is bounded and hashed into approval fingerprints; changed content requires new approval. Labels/encoding remain guidance, not a prompt-injection security boundary. Exact archive `ed78bdb` passed 132/132 Linux tests with zero skips; CI passed, draft #34 open. Not installed. See [handover](handovers/2026-09-28-followup-context.md).

## R10 partial candidate — durable task/project creation receipts

Task/project creation now supports unique session-scoped request IDs, canonical payload hashes and transactional result receipts. Same-session browser retries recover the original task/project across response loss or process restart; changed input cannot reuse an ID. The browser persists pending requests before sending and asks before treating edited uncertain input as different work. Explicit task-schema migration 1→2; old releases reject newer task state. Exact 0.32.0 archive passed 136/136 Linux tests and CI; not installed. Asynchronous Git preparation and idempotency/recovery review for remaining mutations are still open. See [handover](handovers/2026-09-28-creation-requests.md).

## R2 formatting progress — candidate 0.32.0

Pinned formatter and CI style checks cover TypeScript/JavaScript runtime, browser, tests and scripts. Mechanical formatting is separate from behavior changes. Typecheck remains the static analysis gate; semantic lint policy, module decomposition and explicit operation compatibility remain open. 136/136 Linux tests passed with zero skips; CI passed; uninstalled.

## R10 task preparation — candidate 0.33.0

Task checkout/snapshot restoration no longer blocks the event loop; cancellation and shutdown hold the same worker slot and preserve partial files. Bounded helper execution uses the shared Git policy and resource admission. Other request-time Git operations and a complete operation compatibility model remain open. Exact archive `ba2c5a5` passed 139/139 Linux tests with zero skips, formatting, typecheck and CI. Not installed.

## R2 admission policy — candidate 0.34.0

Twelve global admission checks are centralized and documented, preserving all 32,768 combinations of the prior fifteen-state decision model. Manager-owned/project-specific and approval checks remain. This establishes a reviewable baseline; owned operation leases, domain decomposition and interleaving proofs remain open. Exact archive passed 141/141 Linux tests, zero skips, formatting, typecheck and CI; draft #38; not installed. See [operation compatibility](operation-compatibility.md).

## R2 dependency domain — candidate 0.35.0

Dependency preparation is extracted from the runner and owns its operation identity until cancellation/cleanup settles. Stale cancellations cannot affect a successor; shutdown closes admission and waits. Existing approval, fingerprint and cross-domain checks remain. Other domain extractions and dependency filesystem/SQL crash reconciliation remain open. Exact archive passed 145/145 Linux tests, zero skips, formatting, typecheck and CI; draft #39; not installed.

## R2 repository domain — candidate 0.36.0

Repository discovery/import/update is extracted with owned completion, cancellation and shutdown cleanup. Existing project-specific protection, native profile handling and global admission are preserved. Immediate cancellation does not invoke transport. Exact archive passed 147/147 Linux tests, zero skips, formatting, typecheck and CI; draft #40; not installed. Publication/feedback and task/check decomposition plus transactional recovery remain open.

## R10/R6 dependency publication recovery — candidate 0.37.0

Dependency selection and job success now share one checked SQLite transaction. Failure/startup cleanup protects referenced and aliased stages and preserves uncertain references. Regression coverage includes publication-write failure and legacy interrupted startup. Physical durability, corrupt-package repair and whole-cache retention remain separate work. Exact archive passed 151/151 Linux tests, zero skips, formatting, typecheck and CI; draft #41; not installed.

## R2 publication domain — candidate 0.38.0

Publication and GitHub feedback share an extracted manager and owned operation slot. Shutdown waits for transport settlement; immediate shutdown prevents transport startup. Approval cancellation remains needs-attention. Existing commit/owner/fingerprint/conflict safeguards remain. Exact archive passed 154/154 Linux tests, zero skips, formatting, typecheck and CI; draft #42; not installed. Task/check decomposition and synchronous review/integration Git work remain open.

## R2 check execution — candidate 0.39.0

Check process, output/resource limits, cleanup and terminal-state handling move to `check-execution.ts`, retaining runner approval/admission and the single task/check worker slot. A running-state database write failure now prevents process startup. Cancellation, stale content, spawn and cleanup failure fixtures added. Exact archive passed 157/157 Linux tests, zero skips, formatting, typecheck and CI; draft #43; not installed. Task dispatch extraction, asynchronous snapshot/review Git and retention reconciliation remain open.

## R2 task execution — candidate 0.40.0

Task execution moves to `task-execution.ts`; a stable handle covers asynchronous checkout through process cleanup. Queue selection, approval/renewal and the single task/check slot remain in the runner. Immediate cancellation skips preparation and command construction. Exact archive passed 161/161 Linux tests, zero skips, formatting, typecheck and CI; draft #44; not installed. Runner request routing/review decomposition, remaining asynchronous Git paths and retention reconciliation remain open.

## Operator priority: provider credits — candidate 0.41.0

The operator explicitly advanced provider credit reporting. Implemented Codex native `account/rateLimits/read` with remaining percentages, reset times, optional credit balance/reset counts, freshness and low-allowance guidance in Operations. Empty provider-only sandbox, access-only snapshot, fixed read-only protocol; no model, reset or purchase requests. Claude/Cursor remain unavailable with direct provider usage links; no undocumented credential endpoint scraping. Exact archive passed 169/169 Linux tests, zero skips, formatting, typecheck and CI; draft #45; not installed. Live installed-account acceptance remains distinct from fixture validation. Other stabilization items remain queued.

## R6 interrupted cleanup recovery — candidate 0.42.0

A new preview and approval can clear a stale worktree record after a previously approved removal succeeded but persistence failed. Exact managed path, absent filesystem entry, absent Git registration and prior cleanup audit are required; uncertain paths remain manual review. No startup deletion or approval replay. Logs recheck ordinary-file identity, size and timestamps before truncation. Tests cover injected persistence failure, restart, missing evidence, registrations, dangling links, recreated content and same-size log changes. Exact archive `3d96810` passed 175/175 required Linux tests with zero skips, formatting, typecheck and CI; draft #46; staged, not installed. Whole-cache/attachment retention, hard quotas and asynchronous cleanup remain open.

## Installed cumulative baseline and R10 preview work

Operator confirmed 0.42.0 installed with 175 passing tests, task schema 2 and live resource cgroups verified. No live cleanup or provider quota acceptance was reported. Candidate 0.43.0 moves GUI change preview snapshots/conflict inspection into bounded cancellable child jobs with session ownership and polling. Existing commit/check/revision operations still recompute exact snapshots synchronously; R10 remains partial. Exact source `53e2173` passed 179/179 required Linux tests with zero skips, formatting, typecheck and CI; local browser flow verified. Draft #47 and cumulative installer staged; candidate uninstalled.

## R10 background check preparation — candidate 0.44.0

Operator confirmed 0.43.0 installed with 179 passing tests, task schema 2 and existing resource limits verified. Candidate 0.44.0 moves the expensive exact-tree snapshot and conflict preflight for Run checks/Recheck committed files into an owner-bound cancellable background job. Reads remain responsive; dispatch and state-changing operations wait. Admission is repeated after preparation, changed content is rejected, and the existing isolated check execution still materializes and tests the exact tree. The direct administrative validation path remains compatible and synchronous. Exact source `6b11638` passed 180/180 required Linux tests with zero skips, formatting, typecheck, CI and browser cancellation/success acceptance; draft #48 is open and staged, not installed.

## R10 background commit preparation — candidate 0.45.0

GUI commit approval now moves exact snapshot/conflict/sensitive-content admission into an owner-bound cancellable background job. Reads remain responsive while dispatch and mutations wait. Final admission still requires passing checks for the exact tree and creates only the local reviewed branch. Exact branch/ref/tree/parent/message verification recovers same-content requests after response loss or service restart; changed requests fail closed. Exact source `05ab5ca` passed 181/181 required Linux tests with zero skips, formatting, typecheck, CI and browser cancellation/success acceptance; draft #49 is open and staged, not installed. Revision/restart/integration mutation preflights and broader runner request-routing decomposition remain open.

## R10 background revision preparation — candidate 0.46.0

Request revisions now moves the exact snapshot and sensitive-content preflight into an owner-bound cancellable background job. Reads remain responsive while dispatch and mutations wait. The retained seed tree still requires separate run, checks and commit approvals. Existing revision identity recovers same-content requests after response loss or restart; different requests fail closed. Exact source `a59e264` passed 182/182 required Linux tests with zero skips, formatting, typecheck, CI and browser cancellation/success acceptance; draft #50 is open and staged, not installed. Restart/integration mutation preflights and broader runner request-routing decomposition remain open.

## R10 background restart preparation — candidate 0.47.0

Restart with current settings now snapshots unresolved partial edits in an owner-bound, cancellable background job. Reads remain responsive while dispatch and mutations wait. Final admission repeats latest-turn and workspace checks; the exact prepared tree is retained and the new run still requires explicit approval. Completed same-source restarts recover through durable task state after response loss or service restart. Exact source `b856bb7` passed 183/183 required Linux tests with zero skips, formatting, typecheck, both CI runs and no-model browser success acceptance. Draft #51 is open; candidate is staged but not installed. Integration mutation preflights and broader runner request-routing decomposition remain open.
