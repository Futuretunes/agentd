# 2026-09-28 — Cumulative overnight batch

- Author: Codex. The operator authorized continuing independent backlog items without waiting for review or intermediate installation.
- Current branch: `feat/async-worktree-preparation`. Draft PRs #26–#37 are stacked; none were merged automatically.
- Exact cumulative source: `ba2c5a53b67be174f875cd890ba81104db127799`, version 0.33.0, task schema 2. Later handover-only commits do not alter this archive.
- Archive SHA-256: `4e90e57f8289408f0280bb7ddb1c7504681ecb58bb9137b6520ebce67e6ba464`.
- Production independently still reports healthy **0.22.0/task schema 1**, both services active. No deployment, model request, account consent, publication or live retention cleanup was performed.

## Implemented and validated, not installed

| Work | Shared handover | Draft PR |
| --- | --- | --- |
| Resource budgets and approval-bound retention | [R6](2026-09-28-resource-retention.md) | #26 |
| Worker namespaces/capabilities/syscall hardening | [R7](2026-09-28-worker-hardening.md) | #27 |
| Shared minimal-environment Git policy | [R12](2026-09-28-git-policy.md) | #28 |
| Shared sensitive-data and binary detection | [R13](2026-09-28-sensitive-data.md) | #29 |
| Bounded large-review output | [R15](2026-09-28-bounded-review.md) | #30 |
| Session-pseudonymous mutation audit coverage | [R19](2026-09-28-session-audit.md) | #31 |
| Native compatibility and fixed-limit visibility | [R17](2026-09-28-native-limits.md) | #32 |
| Safe browser error boundary | [R18](2026-09-28-public-errors.md) | #33 |
| Explicit previous-answer context control | [R16](2026-09-28-followup-context.md) | #34 |
| Transactional durable creation receipts | [R10 part](2026-09-28-creation-requests.md) | #35 |
| Standalone mechanical formatting and CI check | [R2 part](2026-09-28-formatting.md) | #36 |
| Responsive and cancellable task checkout | [R10 part](2026-09-28-async-preparation.md) | #37 |

Final exact Linux validation: **139/139 tests, zero skips**, formatting check and typecheck passed. CI run 36484873135 passed. Linux boundary fixtures include real isolation; native provider acceptance under the cumulative service changes remains unperformed. Initial async-preparation validation exposed a fixture timing assumption; the corrected test waits for its actual partial edit instead of assuming running means checkout completed.

## Operator staging

One hash-verified cumulative administrator launcher and the exact archive are staged privately on the VM. Its syntax and archive hash were verified, but it was not executed. It runs the tracked managed application update, then the explicit resource-profile migration. It does not rerun the already-installed gateway migration. Host-specific paths and command are in the private operator staging note, not this public repository.

Application update and resource migration are separate transactions. If resource migration fails after the application update, the launcher reports that distinction; inspect its recovery journal and backups before retrying. The application rollback must restore matching task schema/application state: older code alone refuses schema 2. Native account profiles remain outside task-state rollback. Legacy, failed and configuration backups are never silently selected for retention removal.

## Next independent work

1. R2: document and test a complete operation compatibility matrix, then extract runner domains without changing approval/security behavior. Formatting is complete; no claim of full runner decomposition.
2. R10: move remaining request-time Git preparation off the event loop; audit recovery/idempotency for remaining mutations. Task/project creation receipts and task checkout are partial completion, not global exactly-once semantics.
3. R6: cleanup crash reconciliation and bounded attachment/dependency retention; hard disk quotas/per-worker cgroups remain distinct future work.
4. R14: paged large/binary review. Current behavior blocks unsupported reviews safely.

Keep the operator's GUI-only goal on the roadmap. R1 release-baseline consolidation/branch protection and R8 narrower GitHub authorization require review/consent decisions; do not silently merge main, widen authorization or weaken host protections. Actual-phone and native-provider acceptance remain separate from fixture results. Continue authorized independent work rather than waiting for this staged script to be run, updating both backlog and handover after each item.
