# Shared handover — Codex and Claude

Start with [repository instructions](../AGENTS.md) and the [latest work-item handover](handovers/2026-09-30-cursor-ntfy-pause.md). Claude's entry point is [CLAUDE.md](../CLAUDE.md). Both agents update these same files after every work item, including partial or blocked work.

## Ownership — 2026-09-29

**Claude owns all development and deployment by operator decision; Codex is paused.** The current line is `release/0.62.2` ([handover](handovers/2026-09-29-claude-0.62.2.md)). Work continues from Claude's latest branch.

## Candidate 0.83.0 — Pause ntfy delivery (Cursor)

Settings > Configuration can pause or resume ntfy pushes without clearing the saved destination. Paused destinations stay in Configuration; approval/completion pushes are skipped until resumed. See [handover](handovers/2026-09-30-cursor-ntfy-pause.md). Not installed.

## Candidate 0.82.0 — GitHub connection status in Configuration (Cursor)

Settings > Configuration shows read-only GitHub connection status and AgentD access ceiling, with a deep link to GitHub settings for connect/reconnect/ceiling changes. See [handover](handovers/2026-09-30-cursor-github-config-status.md). **Live-installed on 192.168.1.20.**

## Candidate 0.81.0 — signed-in HTTPS origin configuration (Cursor)

Settings > Configuration shows and can change the managed signed-in https origin with step-up preview; phone gateway restart is required afterward. See [handover](handovers/2026-09-30-cursor-origin-config.md). **Live-installed on 192.168.1.20.**

## Candidate 0.80.0 — ntfy authenticated deep links and durable dedupe (Cursor)

ntfy click URLs deep-link to project/conversation on the signed-in HTTPS origin (no secrets in the URL). Notified task+status keys persist under stateDir across runner restarts. See [handover](handovers/2026-09-30-cursor-ntfy-deep-links.md). **Live-installed on 192.168.1.20.**

## Candidate 0.79.0 — ntfy approval and completion delivery (Cursor)

When an ntfy destination is configured, AgentD sends best-effort pushes for approval waits and terminal run statuses. See [handover](handovers/2026-09-30-cursor-ntfy-delivery.md). **Live-installed on 192.168.1.20.** Deep links and durable dedupe follow in 0.80.0.

## Candidate 0.78.0 — ntfy destination configuration (Cursor)

Settings > Configuration can save or clear an https ntfy server and topic with step-up preview. Push delivery remains a follow-up. See [handover](handovers/2026-09-30-cursor-ntfy-config.md). **Live-installed on 192.168.1.20.**

## Candidate 0.77.0 — Access-key recovery file deletion (Cursor)

Settings > Access key can delete leftover root-only `/etc/agentd/mobile-access.txt` with step-up preview (O2). See [handover](handovers/2026-09-30-cursor-access-key-recovery-delete.md). **Live-installed on 192.168.1.20.**

## Candidate 0.76.0 — Configuration profile enable (Cursor)

Settings > Configuration can enable a missing standard resource profile or gateway hardening profile (one-way) via fixed oneshot jobs and step-up access-key preview. See [handover](handovers/2026-09-30-cursor-profile-enable.md). **Live-installed on 192.168.1.20.**

## Candidate 0.75.0 — Claude and Codex approved CLI installs (Cursor)

Settings > Agents & CLIs can install operator-approved Claude and Codex packages via the same helper as Cursor. See [handover](handovers/2026-09-30-cursor-claude-codex-cli.md). Not installed.

## Candidate 0.74.1 — restore without restoreUnit key (Cursor)

0.74.0 briefly recorded `restoreUnit` in update.json, which made older backups reject the configuration. 0.74.1 installs `agentd-restore@.service` beside rollback with no new config key. See [handover](handovers/2026-09-30-cursor-restore-no-config-key.md). Not installed.

## Candidate 0.74.0 — selected backup restore (Cursor)

Settings > Backups can restore a selected older compatible managed backup via `agentd-restore@<backup-id>.service`, with step-up preview. Default rollback target remains available. See [handover](handovers/2026-09-30-cursor-backup-restore-selected.md). Not installed.

## Candidate 0.68.0 — configuration overview (Cursor)

Settings > Configuration shows a read-only managed hardening/resource/TLS overview. Mutations remain future work. See [handover](handovers/2026-09-29-cursor-configuration-overview.md). Not installed.

## Candidate 0.67.0 — managed backups (Cursor)

Settings > Backups lists sanitized managed update backups and can remove only retention-eligible items with step-up preview. Version restore remains Updates rollback. See [handover](handovers/2026-09-29-cursor-managed-backups.md). Not installed. Next admin slice: configuration pages.

## Candidate 0.66.0 — Agents & CLIs versions (Cursor)

Settings > Agents & CLIs shows installed vs tested native CLI versions, refresh, and the guided host update procedure. Binary install from the phone remains deferred. See [handover](handovers/2026-09-29-cursor-cli-versions.md). Not installed. Next admin slice: GUI backups.

## Candidate 0.65.0 — approval-gated service restart (Cursor)

Settings > Diagnostics can restart the task runner or phone gateway with step-up access-key preview, idle admission and fixed helper `systemctl restart` of configured units only. See [handover](handovers/2026-09-29-cursor-service-restart.md). Not installed.

## Installed and live-accepted 0.64.1 — reload_required, single restart (Claude)

Unloaded unit files (often another program's) are reported as `reload_required` with the exact fix, not as drift. Updates restart services once, and new job units install automatically. Operator installed 0.64.1 from Settings > Updates and confirmed rollback to 0.64.0 works. See [handover](handovers/2026-09-29-claude-0.64.1.md).

## Installed 0.64.0 — in-app rollback (Claude)

Settings > Updates can roll back to the newest compatible older version and its task data, saving what was running first. See [handover](handovers/2026-09-29-claude-in-app-rollback.md). Live rollback acceptance confirmed with 0.64.1 → 0.64.0 on 2026-09-29.

## Candidate 0.63.0 — in-app updates (Claude)

Settings > Updates installs **approved** releases through the runner, the administration helper and a fixed `agentd-update@<version>.service` job, with step-up key checks, a preview fingerprint and idle admission. See [handover](handovers/2026-09-29-claude-in-app-updates.md) and [managed updates](managed-updates.md). The host needs `apply_updates.py` once after installing.

## Candidate 0.62.0 — safe GUI diagnostics

[Latest handover](handovers/2026-09-29-codex-gui-diagnostics.md): Settings now shows and downloads a bounded report of release, managed drift/recovery, fixed service status, storage, uptime and recent sanitized failures. A fixed no-argument root probe cannot read task state, worktrees or account profiles and returns no raw journals, logs, prompts, paths, config contents or credentials. Managed updates restart the helper after an application swap. Exact source `192d25b` passed all 211 zero-skip Ubuntu deployment tests, typecheck, formatting and all Node 24/26/Ubuntu isolation CI. The application update is installed; the helper migration rolled back cleanly after exposing the startup race described below.

The first operator install subsequently completed the 0.62.0 application swap and
all 211 zero-skip Ubuntu tests, then exposed a helper-socket startup race in the
one-time migration. Candidate 0.62.1 adds bounded readiness waits to both helper
migrations. Exact source `15df341` passed 212 portable tests with 9 expected
Linux-only skips, typecheck, formatting and all Node 24/26/Ubuntu isolation CI.
The replacement archive, rollback verifier and launcher are staged but
unexecuted. Production runs the healthy 0.62.0 application with runner/gateway
active; the helper is absent after a complete rollback. Private recovery state
and hashes are in the VM operator handover.

## Candidate 0.61.0 — GUI access-key rotation

[Latest handover](handovers/2026-09-29-codex-access-key-rotation.md): Settings now provides step-up-authenticated, exact-preview key rotation. A fixed-purpose root helper atomically changes only the root-owned access hash; the gateway has no helper access, generated plaintext is not retained, other sessions are invalidated and audit excludes secret material. Exact source `7096170` passed 207/207 zero-skip Ubuntu validation, typecheck, formatting and all required CI. Draft #67 and the cumulative archive/launcher are staged but unexecuted. Production stays on 0.59.1.

## Candidate 0.60.0 — GitHub access ceilings

[Latest handover](handovers/2026-09-29-github-access-ceilings.md): GitHub connections now persist an AgentD ceiling for repository operations, feedback reads or approved draft publishing. The runner enforces the ceiling before credential-bearing transports start, invalid metadata fails closed, and older connections become repository-only until explicit reconnection. The GUI separately discloses GitHub CLI's broader standard classic OAuth grant. This cumulative branch includes Claude's reviewed 0.59.1 rename-coverage, worker and gateway hardening changes. Exact source `2f3ede0` passed 203/203 required Ubuntu tests with zero skips, typecheck and formatting; Node 24/26 and required Linux CI passed. PR #66 is ready for review against PR #65; the exact archive and launcher are staged but unexecuted. Production remains 0.59.1.

## Installed 0.59.1 — Claude review fixes plus gateway hardening (12:33 UTC; `main` = PR #60, protected)

[Review](reviews/2026-09-29-claude-review-0.22-0.59.md), [handover](handovers/2026-09-29-claude-review-fixes.md), branch `fix/codex-review-2026-09-29`.

- **F1 (high):** change listings detected renames, so a renamed file's deleted old path was missing from 0.59's required large-review coverage. Reproduced. Fixed with `--no-renames` and a regression test.
- **F2 (medium):** the worker seccomp filter now also denies io_uring (ENOSYS), `open_tree` and `process_vm_*`, and this is proven inside the real sandbox.
- Linux: 201/201, 0 skipped.
- Gateway separation, limits, sandbox flags and storage cleanup were verified live or in code.

Production now runs 0.59.1, with the gateway hardening applied and recorded. `main` is protected: PRs plus the three required checks. PR #61 now targets `main`; this work is PR #65.

## Candidate 0.59.0 — exact-coverage large-review commit gate

[Latest handover](handovers/2026-09-29-large-review-commit-gate.md): truncated aggregate reviews can run checks and commit only after every changed file has durable coverage for the same task and exact Git tree. Passing exact-tree checks, no conflicts and no blocked sensitive/binary/unscannable files remain mandatory. Revision and restart stay blocked. Exact source `39c30b4` passed 200/200 required Linux tests with zero skips, typecheck and formatting; Node 24/26 and required Linux CI passed. PR #64 is ready for review against PR #63's branch. The cumulative archive and launcher are staged but unexecuted. Production remains 0.55.0.

## Candidate 0.58.0 — bounded paginated large-file review

[Latest handover](handovers/2026-09-29-paginated-large-review.md): one individually oversized safe text diff is split into stable UTF-8 pages capped at 64 KiB, with exact whole-file and page fingerprints plus durable audited per-page coverage. Loading a page never marks it reviewed. Complete coverage remains evidence only; commit/revision/restart stay blocked for truncated reviews. Exact source `f132af0` passed 200/200 required Linux tests with zero skips, typecheck and formatting; Node 24/26 and required Linux CI passed. PR #63 is ready for review against PR #62's branch. The cumulative archive and launcher are staged but unexecuted. Production remains 0.55.0.

## Candidate 0.57.0 — durable exact-tree large-review acknowledgements

[Latest handover](handovers/2026-09-29-durable-large-review-acknowledgements.md): individually bounded files require an explicit audited acknowledgement tied to the task, exact tree, filename and patch fingerprint. Progress survives restart but never transfers to changed content. Complete acknowledgement remains evidence only; commit/revision/restart stay blocked for truncated reviews. Exact source `8117de5` passed 197/197 required Linux tests with zero skips, typecheck and formatting; Node 24/26 and required Linux CI passed. PR #62 is ready for review against PR #61's branch. The cumulative archive and launcher are staged but unexecuted. Production remains 0.55.0.

## Candidate 0.56.0 — bounded per-file large-review inspection

[Latest handover](handovers/2026-09-29-bounded-large-review.md): aggregate-large safe text reviews expose owner-bound, exact-tree per-file inspection with repeated binary, sensitive-data and output bounds. Commit/revision/restart remain blocked for truncated reviews. Exact source `652b518` passed 196/196 required Linux tests with zero skips, typecheck and formatting; Node 24/26 and required Linux CI passed. PR #61 is ready for review against PR #60's branch. The cumulative archive is staged but unexecuted. Production remains 0.55.0.

## Installed baseline — 0.55.0

Read-only verification after the operator ran the staged managed updater confirms service version 0.55.0, task schema 2, serial dispatch enabled and starts 39. The exact validated archive was used; no installer remains active. Phone workflow acceptance and independent review/merge remain separate.

## Candidate 0.55.0 — consolidated request-routing baseline

[Latest handover](handovers/2026-09-29-routing-baseline.md): the complete 0.49–0.55 stack is consolidated into main-targeted PR #60, ready for review. Every supported request operation has one startup-validated owner; unknown input remains fail-closed. Exact implementation `1a6d7dc` passed 194/194 required Linux tests with zero skips, typecheck and formatting. Consolidated Node 24/26 and Linux CI passed; independent review remains pending. The exact archive is installed. Production health reports 0.55.0, task schema 2 and starts 39.

## Candidate 0.55.0 — complete explicit request routing

[Latest handover](handovers/2026-09-29-support-routing.md): attachments, execution settings/model refresh and storage review/cleanup now have an explicit support route. Every supported request operation has one startup-validated owner; malformed and unknown requests retain the fail-closed fallback. Exact source `1a6d7dc` passed 194/194 required Linux tests with zero skips, typecheck and formatting. PR #59 is ready for review and targets PR #58's branch; Node 24/26 and Linux CI passed. The cumulative archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.54.0 — explicit task-lifecycle routing

[Latest handover](handovers/2026-09-29-task-routing.md): task creation, retry, detail/output, review/validation, commit/discard, approval and cancellation now have one explicit route owner. Existing receipts, approvals, exact-content checks, audit and cancellation semantics are unchanged. Exact source `5c48c82` passed 193/193 required Linux tests with zero skips, typecheck and formatting. PR #58 is ready for review and targets PR #57's branch; Node 24/26 and Linux CI passed. The cumulative archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.53.0 — explicit workspace-mutation routing

[Latest handover](handovers/2026-09-29-workspace-mutation-routing.md): project setup/lifecycle and conversation lifecycle mutations now have a disjoint explicit route. Existing admission, audit and durable creation-receipt behavior is unchanged. Exact source `100b5fa` passed 192/192 required Linux tests with zero skips, typecheck and formatting. PR #57 is ready for review and targets PR #56's branch; Node 24/26 and Linux CI passed. The cumulative archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.52.0 — explicit workspace-read routing

[Latest handover](handovers/2026-09-29-workspace-read-routing.md): project lists, conversation history/detail and local task listing now have a disjoint explicit read route. Returned data and mutation authority are unchanged. Exact source `742eec8` passed 191/191 required Linux tests with zero skips, typecheck and formatting. PR #56 is ready for review and targets PR #55's branch; Node 24/26 and Linux CI passed. The cumulative archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.51.0 — explicit service-read routing

[Latest handover](handovers/2026-09-29-service-read-routing.md): capabilities, Operations status and local audit reads now have a disjoint explicit route owner. Returned data and browser authority are unchanged. Exact source `faf9642` passed 190/190 required Linux tests with zero skips, typecheck, formatting and Node 24/26 CI. PR #55 is ready for review and targets PR #54's branch; the cumulative archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.50.0 — explicit routing for extracted managers

[Latest handover](handovers/2026-09-29-managed-request-routing.md): publication/feedback, dependency, GitHub, repository and native-account operations now have one startup-validated route owner. The existing preparation mutation exclusion is shared by managed and core paths. Exact source `268e28a` passed 189/189 required Linux tests with zero skips, typecheck, formatting and Node 24/26 CI. PR #54 is ready for review against the unmerged cumulative baseline; the exact archive is staged but unexecuted. Production remains 0.43.0.

## Candidate 0.49.0 — cumulative reviewed release baseline

[Latest handover](handovers/2026-09-29-reviewed-release-baseline.md): review/check/commit/revision/restart preparation operations now have an explicit startup-validated request route owner. Duplicate route claims fail before service startup, while existing approval, isolation and exact-content checks remain unchanged. The complete linear stack is consolidated in main-targeted PR #53, ready for independent review. Exact source `e96027d` passed 188/188 required Linux tests with zero skips plus Node 24/26 CI. The exact archive and cumulative launcher are staged but unexecuted; production remains 0.43.0. Stop here pending independent review and an explicit merge/tag decision.

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

- [2026-09-29 — In-app rollback (Claude)](handovers/2026-09-29-claude-in-app-rollback.md)
- [2026-09-29 — In-app updates (Claude)](handovers/2026-09-29-claude-in-app-updates.md)
- [2026-09-29 — 0.62.2 fixes (Claude)](handovers/2026-09-29-claude-0.62.2.md)
- [2026-09-29 — Claude review of 0.22–0.59 and fixes](handovers/2026-09-29-claude-review-fixes.md)
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
