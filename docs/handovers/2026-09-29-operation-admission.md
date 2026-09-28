# 2026-09-29 — Explicit operation admission policy

- Author: Codex; overnight continuation, R2 partial.
- Status: implemented and exact Linux validated; CI passed; not installed.
- Release: cumulative 0.34.0, task schema 2.
- Branch/base: `refactor/operation-admission` from `feat/async-worktree-preparation` at `12fd484`.

## Changes

Extracted twelve global admission decisions to `src/operation-policy.ts`. Runner state reads remain lazy, preserve the old short-circuit order and leave ownership/manager/project-specific guards unchanged. `docs/operation-compatibility.md` documents the directional matrix, aggregate meanings, mandatory additional gates and known asymmetries. This is not an exclusive lock implementation or a concurrency relaxation. Existing worker, cancellation and durable recovery ownership stays in the runner.

## Validation

Independent original Boolean expressions verify all 32,768 combinations of fifteen states for twelve admission rules. Focused tests also verify lazy reads and deliberate directionality. 18 focused runner/preparation/policy tests passed. Exact archive `1daf51f4fb2da99dc99fbd6dcb1458e726a8c26e` passed 141/141 required Linux tests with zero skips, formatting and typecheck. Archive SHA-256: `e7bf7237ad63de3b81c6a936a490d17cd915415e54cc5fb11d8c8ecc1cad2a13`. CI run 36492197536 passed; draft PR #38 is open. No live model/account/publication, deployment or deletion operations.

## Deployment and rollback

Production remains the prior 0.22.0; the single private cumulative installer now targets the validated 0.34.0 archive and remains unexecuted. Its syntax and hashes were verified after staging. Schema remains 2, so rollback to installed schema 1 requires matching saved application/task state, with native profiles preserved independently.

## Limitations and next steps

R2 remains partial: manager-owned slots are not replaced with operation leases and the runner is not fully decomposed. Current asymmetric overlap is documented as observed behavior, not proved safe. Next extract a single domain with tests for owned acquisition/release and cancellation; retain project-specific and approval checks. Remaining request-time Git operations (R10) and cleanup reconciliation (R6) remain on the backlog. Keep shared handovers current; do not wait for intermediate installation.
