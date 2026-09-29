# Shared handover — Codex and Claude

Start with [repository instructions](../AGENTS.md) and the [latest work-item handover](handovers/2026-09-29-async-integration-preparation.md). Claude's entry point is [CLAUDE.md](../CLAUDE.md). Both agents update these same files after every work item, including partial or blocked work.

## Candidate 0.48.0 — background integration preparation and application

[Handover](handovers/2026-09-29-async-integration-preparation.md): base integration Git preflights and approved worktree materialization now run in the owned publication/feedback slot. Reads stay responsive; creation is cancellable and exact-tree/ref verification remains mandatory. Interrupted approved creation requires explicit same-preview reconciliation. Exact source `4705736` passed 185/185 Linux tests with zero skips, formatting, typecheck and both CI runs. Draft #52 and the cumulative installer are staged but unexecuted. Installed baseline remains 0.43.0.

## Candidate 0.47.0 — background restart preparation

[Handover](handovers/2026-09-29-async-restart-preparation.md): Restart with current settings now preserves unresolved edits through an owner-bound cancellable background snapshot, then creates a separate approval-bound run. Reads stay responsive and competing mutation/dispatch waits. Exact source `b856bb7` passed 183/183 Linux tests with zero skips, formatting, typecheck, both CI runs and no-model browser success acceptance. Draft #51 is open and the cumulative installer is staged but unexecuted. Installed baseline remains 0.43.0.

## Candidate 0.46.0 — background revision preparation

[Handover](handovers/2026-09-29-async-revision-preparation.md): Request revisions now preserves its exact edit tree through an owner-bound cancellable background job. Mutations and dispatch wait while reads remain responsive. Existing revision identity recovers completed same-content requests across response loss or restart. Exact source `a59e264` passed 182/182 required Linux tests with zero skips, formatting, typecheck, both CI runs and browser cancellation/success acceptance. Draft #50 is open and the cumulative installer is staged but unexecuted. Installed baseline remains 0.43.0.

## Candidate 0.45.0 — background commit preparation

[Handover](handovers/2026-09-29-async-commit-preparation.md): GUI commit approval now runs exact snapshot admission in an owner-bound cancellable background job. Competing mutations and task dispatch wait while reads stay responsive. Exact ref/tree/parents/message checks recover a completed request after response loss or restart. Exact source `05ab5ca` passed 181/181 required Linux tests with zero skips, formatting, typecheck, both CI runs and the browser cancellation/success flow. Draft #49 is open and the cumulative installer is staged but unexecuted. Installed baseline remains 0.43.0.

## Candidate 0.44.0 — background check preparation

[Handover](handovers/2026-09-29-async-check-preparation.md): the GUI now prepares exact check snapshots in an owner-bound, cancellable background job before launching the existing isolated check execution. State-changing operations and task dispatch wait, reads remain responsive, and changed content fails before checks start. Exact source `6b11638` passed 180/180 required Linux tests with zero skips, formatting, typecheck, both CI runs and the browser cancellation/success flow. Draft #48 is open and the cumulative installer is staged but unexecuted. Installed baseline remains 0.43.0.

## Installed baseline — 0.43.0

The operator reported successful cumulative installation: 179/179 tests, task schema 2, service healthy with starts 38, and resource limits already verified. A managed application backup was created; configuration, projects and native profiles were preserved. Phone acceptance of background preview progress/cancellation remains pending.

## Candidate 0.43.0 — background change previews

[Handover](handovers/2026-09-29-async-review.md): GUI change previews run in a bounded cancellable background helper, with session-owned polling and mutation exclusion. Checks/commits still revalidate exact content. Exact source `53e2173` passed 179/179 required Linux tests with zero skips, formatting, typecheck and CI. Local browser progress/completion/cancellation verified; draft #47 is open. The cumulative installer is staged for 0.43.0, unexecuted; installed baseline remains 0.42.0.

## Installed baseline — 0.42.0

The operator reported successful cumulative installation: 175/175 tests, task schema 2, live cgroup resource limits verified, service healthy with starts 37. Application/configuration rollback backups were created; native profiles and project checkouts preserved. Provider usage live acceptance and production cleanup remain unverified. Earlier candidate sections below are historical staging records.

## Candidate 0.42.0 — approved cleanup recovery

[Handover](handovers/2026-09-29-retention-recovery.md): a fresh storage approval can reconcile a previously removed worktree when the earlier cleanup failed to persist its result. Missing paths without cleanup evidence, remaining Git registrations and links stay protected. Log identity and timestamps are rechecked. Exact archive `3d96810` passed 175/175 required Linux tests with zero skips, formatting, typecheck and both CI runs; draft #46 is open. The single cumulative installer targets validated 0.42.0 and remains unexecuted. Production remains 0.22.0/schema 1. Next: asynchronous review/snapshot/integration jobs (R10), retaining explicit approvals and operation ownership.

## Candidate 0.41.0 — provider usage and credits

[Handover](handovers/2026-09-29-provider-usage.md): Operations reads Codex quota windows and optional provider credits through a bounded, isolated native metadata probe. Claude/Cursor have explicit unavailable states and provider links. Exact archive `7079ed2` passed 169/169 Linux tests with zero skips, formatting, typecheck and CI; draft #45 is open. Cumulative 0.41.0 is staged but not installed; live native account acceptance pending.

## Candidate 0.40.0 — task execution ownership

[Handover](handovers/2026-09-29-task-owner.md): checkout, isolated agent execution, output/resource handling and cleanup have a separate lifecycle module and a stable ownership handle. Immediate cancellation skips checkout and command construction. Exact archive `87e8d2c` passed 161/161 Linux tests, zero skips, formatting, typecheck and CI; draft #44 is open. Cumulative 0.40.0 is staged but not installed.

## Candidate 0.39.0 — check execution ownership

[Handover](handovers/2026-09-29-check-owner.md): isolated validation execution has a separate lifecycle module while retaining the shared worker slot. Running-state persistence precedes process launch; failures cannot leave an untracked check child. Exact archive `5a4c4e2` passed 157/157 Linux tests, zero skips, formatting, typecheck and CI; draft #43 is open. Cumulative 0.39.0 is staged but not installed.

## Candidate 0.38.0 — publication and feedback ownership

[Handover](handovers/2026-09-29-publication-owner.md): publishing and GitHub feedback move into a shared domain manager with owned shutdown, preserving their mutual exclusion and approval checks. Exact archive `5de9de5` passed 154/154 Linux tests with zero skips, formatting, typecheck and CI; draft #42 is open. The cumulative installer is staged for 0.38.0 but unexecuted; production remains unchanged.

## Candidate 0.37.0 — dependency publication recovery

[Handover](handovers/2026-09-29-dependency-recovery.md): project dependency selection and job success publish atomically; failure/startup cleanup preserves referenced or uncertain stages. Fault-injection and restart coverage added. Exact archive `6463492` passed 151/151 Linux tests, zero skips, formatting, typecheck and CI; draft #41 is open. The cumulative installer is staged for 0.37.0; not deployed.

## Candidate 0.36.0 — repository operation ownership

[Handover](handovers/2026-09-29-repository-owner.md): repository discovery/import/update has a separate manager with owned cancellation and shutdown cleanup, retaining existing project and admission rules. Exact archive `06a8391` passed 147/147 Linux tests, zero skips, formatting, typecheck and CI; draft #40 is open. Production remains unchanged; the single installer is staged for 0.36.0 and has not been run.

## Candidate 0.35.0 — dependency operation ownership

[Handover](handovers/2026-09-29-dependency-owner.md): dependency setup is a separate manager with owned cancellation/completion and unchanged admission gates. Exact archive `d76fba7` passed 145/145 Linux tests with zero skips, formatting, typecheck and CI; draft #39 is open. No deployment; the single installer is staged for 0.35.0 and has not been executed.

## Candidate 0.34.0 — explicit operation admission

[Handover](handovers/2026-09-29-operation-admission.md): twelve admission checks now share a documented directional policy. Exhaustive legacy-state parity preserves behavior; exact archive `1daf51f` passed 141/141 Linux tests, zero skips, formatting, typecheck and CI. Draft #38 is open. This is not a new global lock; manager/project/approval gates remain. Production unchanged, the single cumulative installer is staged for 0.34.0 but has not been run.

## Overnight batch — ready for shared review, not installed

[Consolidated handover](handovers/2026-09-28-overnight-batch.md) lists all twelve stacked work items, exact validation, staged cumulative release and remaining gaps. Production remains 0.22.0; candidate 0.33.0 uses task schema 2. Continue R2 operation compatibility and remaining R10 work without waiting for operator installation.

## Candidate 0.33.0 — responsive task preparation

[Handover](handovers/2026-09-28-async-preparation.md): bounded child-process checkout preserves the worker slot, cancellation, shutdown and partial work. Exact candidate `ba2c5a5` passed 139/139 Linux tests, zero skips, formatting, typecheck and CI. Draft #37 and a private cumulative installer are staged. R10 other synchronous Git operations and R2 lock/decomposition work remain open. Cumulative release is uninstalled; production 0.22.0 unchanged.

## Candidate 0.32.0 — reviewable formatting

[Handover](handovers/2026-09-28-formatting.md): pinned formatter, CI check and separate mechanical source formatting. No intended behavior change; 136/136 Linux tests passed with zero skips; CI passed. R2 module decomposition/lock design remains open. Production stays 0.22.0.

## Candidate 0.32.0 — durable creation requests (task schema 2)

[Handover](handovers/2026-09-28-creation-requests.md): task/project creation retries reuse a durable result bound to session and request content. Browser pending IDs survive same-tab refresh; different work after an uncertain send requires an explicit choice. Task schema 1→2 migration is transactional. Exact archive `f71f0f5` passed 136/136 Linux tests with zero skips; typecheck and CI passed; draft #35 is open. Production remains 0.22.0/schema 1. R10 asynchronous Git work and broader mutation recovery remain open.

## Candidate 0.31.0 — explicit follow-up context

[Handover](handovers/2026-09-28-followup-context.md): inherited project/conversation/agent and next-run settings can include the previous saved answer or omit prior context. Raw logs are never included. Bounded JSON reference content is hashed into approval snapshots and checked again before invocation. Exact archive `ed78bdb` passed 132/132 Linux tests with zero skips; CI passed, draft #34 open. Production remains 0.22.0. Continue durable creation receipts (R10) and cumulative release staging.

## Candidate 0.30.0 — safe browser error boundary

[Handover](handovers/2026-09-28-public-errors.md): browser errors use reviewed fixed messages; unexpected exceptions and stored error metadata are normalized at both runner gateway and HTTPS boundaries. Exact archive `b003248` passed 130/130 Linux tests with zero skips; CI passed. Includes prior overnight work; production remains 0.22.0. Next: explicit follow-up context controls (R16) and cumulative staging.

## Candidate 0.29.0 — native compatibility and limits

[Handover](handovers/2026-09-28-native-limits.md): Operations shows tested/observed CLI versions, compatibility status and native fixed limits. Approval snapshots include native limits; model/renewal/protocol version pins share one source. Exact archive `c11b35f` passed 128/128 Linux tests, zero skips; CI passed, draft #32 open. Cumulative overnight release remains uninstalled, production 0.22.0 unchanged.

## Candidate 0.28.0 — session audit coverage

[Handover](handovers/2026-09-28-session-audit.md): browser mutations carry a cookie-derived session owner; the runner records a separate audit pseudonym. Added transactional project creation/rename, conversation rename and discard records, plus task creation. Exact archive `ed949de` passed 127/127 Linux tests with zero skips; CI passed, draft #31 open. Cumulative safeguards remain uninstalled; production 0.22.0 is unchanged.

## Candidate 0.27.0 — bounded large reviews

[Handover](handovers/2026-09-28-bounded-review.md): oversized patches return a bounded, unapprovable review instead of raw Git buffer errors. Exact archive `4e60f4d` passed 126/126 Linux tests with zero skips; CI passed, draft #30 open. Includes prior overnight safeguards; installed 0.22.0 unchanged. Next: actor attribution and missing mutation audits, then cumulative staging.

## Candidate 0.26.0 — shared sensitive-data checks

[Handover](handovers/2026-09-28-sensitive-data.md): reviews and publishing share filename and bounded credential-content rules. Suspect patches are withheld; outgoing history is scanned commit by commit. Binary detection uses Git metadata. Exact archive `3af7da7` passed 125/125 Linux tests, zero skips; CI passed. [Draft #29](https://github.com/Futuretunes/agentd/pull/29) is open. Installed 0.22.0 unchanged. Includes R6, R7 and R12 candidates. Next: assess remaining reliability work and prepare one cumulative update.

## Candidate 0.25.0 — shared Git policy

[Git policy handover](handovers/2026-09-28-git-policy.md): repository import/update, task worktrees, snapshots, reviews, size checks and cleanup now share configuration and environment safeguards. Exact archive `0373bf9` passed 122/122 Linux tests with zero skips; CI passed. [Draft #28](https://github.com/Futuretunes/agentd/pull/28) is open. Cumulative with resources/retention and worker hardening; installed 0.22.0 unchanged. Next: R13 sensitive-data checks.

## Candidate 0.24.0 — worker hardening

[Worker hardening handover](handovers/2026-09-28-worker-hardening.md): explicit namespaces/capability policy and a fail-closed syscall filter now cover workers, renewal, checks and dependency preparation. Exact archive `de1db8a` passed 120/120 Linux tests, zero skips; CI passed. [Draft #27](https://github.com/Futuretunes/agentd/pull/27) is ready for review. Includes the preceding resource/retention work. Installed 0.22.0 is unchanged. Continue R12 Git policy and R13 shared sensitive-data checks, then prepare a cumulative operator update.

## Candidate 0.23.0 — resources and retention

[Resource handover](handovers/2026-09-28-resource-retention.md): service resource profile, bounded task/check output, checkout/disk guards, GUI cleanup previews and provenance-based backup retention are implemented locally. Exact archive `053ff6e` passed 118/118 Linux tests with zero skips; CI passed. [Draft #26](https://github.com/Futuretunes/agentd/pull/26) is ready for review. Installation remains pending. Production stays on verified 0.22.0. The operator requested continuing backlog work without waiting for individual scripts; prepare a cumulative release and keep per-item handovers. Next: R7 worker hardening.

## Installed 0.22.0 — separate web gateway

R5 is implemented on `feat/separate-web-gateway`; [latest handover](handovers/2026-09-28-separate-web-gateway.md). Runner-enforced browser protocol, runner-owned images, separate gateway UID/socket/configuration and a rollback-capable identity migration are staged in [draft PR #25](https://github.com/Futuretunes/agentd/pull/25). Exact source `8f03334` passed 112/112 Linux tests with zero skips and all Node 24/26/Linux-isolation CI jobs. The operator completed installation and the live UID/mount-namespace acceptance gate. Independent read-only verification confirms source `8f03334`, version 0.22.0, task schema 1, starts 35, both services active and the gateway isolated as `agentd-web` without writable paths or runner-group membership. Private files/admin operations were denied by the installer probe. No model tasks or post-install phone acceptance were performed. Next: Claude review, phone acceptance and R6 resource/retention controls.

## Installed 0.21.2 — installer validation follow-up

The operator completed installation. Independent read-only health and release-manifest checks confirm 0.21.2 at `add2d08`, metadata/task schema 1, serial dispatch enabled, starts 33 and both services active. Installer output reports 107 tests passed with zero skips and preserved units/configuration/project checkouts/native profiles. See [handover](handovers/2026-09-28-candidate-validation.md), [Claude review response](reviews/2026-09-28-claude-combined-0.21.1-response.md), and [draft PR #24](https://github.com/Futuretunes/agentd/pull/24).

Claude's frontend and prior updater hardenings are retained. The candidate validation gaps and subsequent calling-path regression are corrected. Earlier failed-attempt/staging notes are historical. No model or new GUI acceptance test was performed. R5 gateway identity/socket separation is next; it is not implemented. No main merge or PR-stack closure occurred.

## Installed 0.21.1 — combined release (deployed 18:53 UTC via the managed updater)

0.21.0 plus the D1–D9 UI fixes plus two updater hardenings, on `release/0.21.1` ([handover](handovers/2026-09-28-combined-0.21.1.md)).

- Linux: 107/107, 0 skipped.
- Deployment tests: 11 OK.
- Startup rehearsal on a copy of the live database: unchanged data, `taskSchemaVersion 1`.

The separate 0.20.1 candidate was never installed and is superseded. Codex: review `release/0.21.1` and base further work on it.

## 0.21.0 — managed deployment and task schema (installed 18:43 UTC, superseded by 0.21.1)

[Handover](handovers/2026-09-28-managed-deployment.md), [draft PR #23](https://github.com/Futuretunes/agentd/pull/23). The operator successfully installed release `8b7c4a2`; independent read-only health confirms version 0.21.0, metadata schema 1, task schema 1, serial dispatch enabled, starts 31, and both services active. Pre-install validation passed 105/105 Linux tests with zero skips and all CI jobs. Two updater compatibility mistakes were corrected before deployment: gateway personality policy and omitted mobile JSON defaults. Units/configuration/native profiles and project checkouts were preserved according to installer output; no model acceptance test was submitted. Earlier deployment statements below are historical.

Next recommended implementation: R5, separate web-gateway identity and socket authority from the task runner. R1 release-baseline strategy and protected-branch enforcement remain unresolved; no main merge is authorized by this note. GUI deployment management and automatic power-loss recovery remain backlog items.

## 0.20.1 candidate (superseded by 0.21.1, never installed): redesign review fixes — 2026-09-28

At the operator's request, Claude fixed D1–D9 on `fix/redesign-review-2026-09-28` ([handover](handovers/2026-09-28-claude-redesign-fixes.md)).

- The diff view shows every changed line (regression tests added).
- A stale conversation falls back cleanly.
- Settings is one panel.
- The composer has a single agent/model/mode picker, and Send becomes Stop.
- Run details use plain language.
- The review is a side panel whose next step reflects check readiness.

Linux: 101/101 tests, 0 skipped. **Not installed.** The host runs 0.20.0 (installed 18:09 UTC, byte-identical to `58d4276`), and that supersedes the "installed 0.19.0" lines below. Claude holds the frontend for this item; base further `public/` work on this branch.

## Claude review of 0.20.0 — 2026-09-28

Claude reviewed the redesign and the R4/R11 fix: [review D1–D9](reviews/2026-09-28-claude-redesign-review.md), [handover](handovers/2026-09-28-claude-redesign-review.md).

- **R4 is verified fixed end to end:** the pre-fix reproducer now fails its defect assertion.
- **R11 is verified:** 99/99 on the host with 0 skips, and the GitHub isolation job passes.
- **D1 (high):** the new diff view hides changed lines that start with `-- ` or `++ `. Reproduced. Fix it with tests first.
- **D5:** the host has run 0.20.0 since 18:09 UTC, byte-identical to `58d4276`, so the "installed 0.19.0 remains" statements below are stale.

Answer in `docs/reviews/2026-09-28-claude-redesign-review-response.md`.

## Candidate 0.20.0 — implementation ready

UI redesign and R4 exact-tree checks are implemented. Linux validation: **99 passed, zero failures/skips**. R11 now has a non-skipping isolation CI job; protected-branch enforcement still needs configuration. See [snapshot-check handover](handovers/2026-09-28-snapshot-checks.md) and [UI handover](handovers/2026-09-28-task-desk-redesign.md). Candidate is staged; installed 0.19.0 remains unchanged until the administrator update. Old passing checks will require fresh verification, including before publishing historical commits. Next: operator acceptance and reviewed release baseline, then reproducible deployment/schema work. Earlier “unfixed” statements below describe the reviewed baseline.

## UI redesign — operator priority change

The operator requested UI/UX implementation immediately, followed by the backlog. Candidate 0.20.0 implements the conversation-first redesign; see [handover](handovers/2026-09-28-task-desk-redesign.md). Installed 0.19.0 is unchanged. Next work is R4/R11. Earlier ordering recommendations are superseded by this explicit request; security and approval invariants remain.

## Codex follow-up — 2026-09-28

Read Claude's consolidated rejoinders at `3735109`. UX corrections and implementation order are now mutually agreed. The backlog explicitly includes truthful New project prerequisite copy and one-click raw logs/downloads. Claude records operator approval of the prototype visual direction; preserve that recorded preference. Sampled revised token pairs pass normal-text contrast, but this is not a full accessibility certification. No application changes, merge to main or deployment occurred. See [follow-up handover](handovers/2026-09-28-ux-rejoinder-assessment.md).

## Claude rejoinders — 2026-09-28

- **Engineering:** [rejoinder](reviews/2026-09-28-claude-rejoinder.md).
  - Every factual correction in Codex's response holds, and all 8 reproductions were confirmed independently on the host.
  - GitHub shows zero reviews and zero comments on #8–#19.
  - The rejoinder recommends an R1 merge strategy for the operator.
- **UX:** [rejoinder](reviews/2026-09-28-claude-ux-rejoinder.md).
  - Codex's UX pushbacks were verified and accepted: U15 focus works, sidebar names exist, current contrast passes, polling exists.
  - The prototype's light-theme contrast failures are fixed.
  - The backlog order is agreed.

**Operator decision, 2026-09-28: visual direction approved.** The operator confirmed the prototype's look ([`docs/design/task-desk-prototype.html`](design/task-desk-prototype.html)): warm neutrals, one clay accent, Geist UI text, serif agent answers, light and dark themes, and the conversation-first layout. UX-4 tokens should follow it, including the AA-corrected colours. It is no longer just a proposal.

Still open for the operator: **R1** (merge strategy) and **U1** (manual-review path for projects without npm checks). Next implementation, once assigned: R4 + R11.

## Review response — 2026-09-28

Codex verified Claude’s findings: [response with R1–R19 and public-safe O1–O7 judgments](reviews/2026-09-28-claude-review-response.md), [bounded reproducer](reviews/2026-09-28-reproduce.mjs), [handover](handovers/2026-09-28-codex-review-response.md). Outcome: 14 Agree, 5 Partly. The ignored-file check defect was reproduced end to end with real Linux check isolation. **These findings remain unfixed.** Next recommendation is R4 + R11, with release-baseline review, formatting and reproducible deployment ahead of new features. Do not merge, deploy or weaken host policy merely because a review proposes it.

Response branch: `review/codex-response-2026-09-28`, based on Claude’s `bc4a6d6`; no application changes. Claude should independently assess the qualifications and evidence.

## Original review — 2026-09-28

Claude reviewed v0.19.0: [review](reviews/2026-09-28-claude-review.md), [handover note](handovers/2026-09-28-claude-review.md). It has 4 high findings:

- **R1:** stacked unmerged PRs are what runs in production.
- **R2:** code density prevents meaningful review.
- **R3:** the deployed configuration isn't in the repo.
- **R4:** checks don't cover git-ignored files. Reproduced.

The requested verification is recorded in the response above. Further feature work should wait for the agreed stabilization work; the operator decides the merge strategy.

## Assessed UI/UX review — 2026-09-28

Claude reviewed the task desk UI: [UX review](reviews/2026-09-28-claude-ux-review.md), [visual prototype](design/task-desk-prototype.html), [handover note](handovers/2026-09-28-claude-ux-review.md). The blockers:

- **U1:** projects without npm checks can never commit. Needs an operator decision.
- **U2:** agent answers are shown as raw Markdown in a terminal box.

The main themes are one primary action per state, removing duplicated panels, and a real design system with a proper phone layout. Codex has recorded [U1–U19 judgments](reviews/2026-09-28-claude-ux-review-response.md) and an [actionable UX backlog](design/ux-backlog.md). No UI change or check waiver was implemented. Suggestion focus already works, output already polls, and sidebar names were present in the inspected browser. Begin core clarity and accessibility foundations after the immediate R4/R11 correction; full UX redesign precedes more feature growth.

## Current state — 2026-09-28

- **Installed release:** v0.19.0, implementation `0af41e2`, confirmed by the operator's successful deployment output; 91 tests passed and both services active.
- **Review branch:** `feat/scoped-agent-settings`, based on `feat/cursor-cli`; [draft PR #19](https://github.com/Futuretunes/agentd/pull/19), stacked on #18. Verify current remote status before acting.
- **Completed:** scoped permissions, visible inheritance, pending approval invalidation, partial-work-preserving restart, model/effort selection and next-run overrides.
- **Still unverified live:** selected-model requests and the remaining provider/GitHub acceptance journeys documented in the detailed note.
- **Next recommendation:** exact-snapshot checks (R4) and mandatory isolation CI (R11), alongside release-baseline decisions; ntfy is deferred. No corrective implementation has been assigned by this handover.
- **Security boundary:** supported installed capabilities only; Codex Chat only; no newly enabled shell, web, MCP, extra host paths or unrestricted network.

This review-response update records findings and bounded diagnostic evidence; it makes no application changes or live model requests.

## History and maintenance

- [2026-09-28 — Combined release 0.21.1](handovers/2026-09-28-combined-0.21.1.md)
- [2026-09-28 — Fixes for redesign review D1–D9](handovers/2026-09-28-claude-redesign-fixes.md)
- [2026-09-28 — Claude review of the 0.20.0 redesign](handovers/2026-09-28-claude-redesign-review.md)
- [2026-09-28 — Exact-tree checks and isolation CI](handovers/2026-09-28-snapshot-checks.md)
- [2026-09-28 — Task desk redesign](handovers/2026-09-28-task-desk-redesign.md)

- [2026-09-28 — Codex follow-up on Claude rejoinders](handovers/2026-09-28-ux-rejoinder-assessment.md)

- [2026-09-28 — Claude rejoinder to UX assessment](handovers/2026-09-28-claude-ux-rejoinder.md)
- [2026-09-28 — UX assessment and backlog](handovers/2026-09-28-ux-backlog.md)
- [2026-09-28 — Claude rejoinder to Codex's response](handovers/2026-09-28-claude-rejoinder.md)
- [2026-09-28 — Codex response to Claude review](handovers/2026-09-28-codex-review-response.md)
- [2026-09-28 — Claude UI/UX review](handovers/2026-09-28-claude-ux-review.md)
- [2026-09-28 — Claude review of v0.19.0](handovers/2026-09-28-claude-review.md)
- [2026-09-28 — Scoped settings and model selection](handovers/2026-09-28-scoped-settings.md)
- [Template for the next work item](handovers/TEMPLATE.md)
- [Remaining backlog](roadmap.md)

Create one dated note per work item, retain earlier notes, and update this entry point. Record implementation commit IDs; the commit containing a handover cannot include its own hash, so use Git history for documentation-only follow-ups. Never put credentials, personal account identities, raw private logs or private infrastructure addresses into these public files.
