# 2026-09-29 — Explicit operation admission policy

- Author: Codex; overnight continuation, R2 partial.
- Status: implemented, exact validation pending; not installed.
- Release: cumulative 0.34.0, task schema 2.
- Branch/base: `refactor/operation-admission` from `feat/async-worktree-preparation` at `12fd484`.

## Changes

Extracted twelve global admission decisions to `src/operation-policy.ts`. Runner state reads remain lazy, preserve the old short-circuit order and leave ownership/manager/project-specific guards unchanged. `docs/operation-compatibility.md` documents the directional matrix, aggregate meanings, mandatory additional gates and known asymmetries. This is not an exclusive lock implementation or a concurrency relaxation. Existing worker, cancellation and durable recovery ownership stays in the runner.

## Validation

Independent original Boolean expressions verify all 32,768 combinations of fifteen states for twelve admission rules. Focused tests also verify lazy reads and deliberate directionality. Runner/preparation regression results and exact Linux/CI evidence follow after completion. Typecheck passed. No live model/account/publication, deployment or deletion operations.

## Deployment and rollback

Production remains the prior 0.22.0; the previous cumulative 0.33.0 installer is staged but unexecuted. After exact validation, update that single private launcher/archive to this cumulative release. Schema remains 2, so rollback to installed schema 1 requires matching saved application/task state, with native profiles preserved independently.

## Limitations and next steps

R2 remains partial: manager-owned slots are not replaced with operation leases and the runner is not fully decomposed. Current asymmetric overlap is documented as observed behavior, not proved safe. Next extract a single domain with tests for owned acquisition/release and cancellation; retain project-specific and approval checks. Remaining request-time Git operations (R10) and cleanup reconciliation (R6) remain on the backlog. Keep shared handovers current; do not wait for intermediate installation.
