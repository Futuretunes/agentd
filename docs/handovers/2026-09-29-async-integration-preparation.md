# 2026-09-29 — Background integration preparation and application

- Author/agent: Codex
- Requested outcome: continue R10 by moving remaining base-integration Git preflights and approved worktree creation out of the request path
- Status: implemented; validation in progress; not installed
- Release: 0.48.0, task schema 2
- Branch and base: `feat/async-integration-application` from `feat/async-restart-preparation`

## Changes and relevant files

- `src/github-review.ts` performs merge-tree generation, conflict inspection, bounded diff creation and sensitive-data scanning through the cancellable asynchronous repository command. The approved worktree is materialized and its HEAD/tree are reverified through the same boundary.
- `src/publication-jobs.ts` journals exact integration approval, deterministic result identity and `applying` state before starting work. The shared publication/feedback slot remains owned through cancellation and cleanup. The final task, event, review-job result and audit record publish in one SQLite transaction.
- `src/task-database.ts` converts a crash-interrupted application to `interrupted`. It is never replayed at startup. A fresh same-preview approval cleans/reconciles the deterministic path and retries; an already-published task is recovered idempotently.
- `src/gateway-protocol.ts`, `src/mobile.ts` and `public/app.js` add owner-bound polling and cancellation. Ordinary reads remain available while state-changing work and task dispatch continue to respect the existing publication admission boundary.
- Repository Git now supports caller-specific output bounds and preserves merge-tree output on the explicitly accepted exit-one path. `test/git-policy.test.mjs` covers the output boundary.
- `test/github-review.test.mjs` covers responsive reads, owner isolation, cancellation cleanup, exact retry and interrupted-job recovery. Existing end-to-end conflict/check/commit/publication tests continue to cover the resulting review.

## Validation evidence

- macOS development environment:
  - formatting and typecheck passed.
  - all non-Linux tests passed in bounded groups; Linux-only isolation tests are intentionally validated in the exact Ubuntu release run.
  - focused GitHub integration, publication, gateway/mobile and recovery coverage passed.
- Exact release archive, Ubuntu validation, CI and no-model browser evidence: pending.

## Deployment and rollback

- No deployment occurred. Production remains the operator-reported 0.43.0/task schema 2 baseline.
- The cumulative installer remains on the prior exact 0.47.0 candidate until 0.48.0 exact validation completes.

## Constraints and known issues

- Local repository configuration validation is still a short synchronous policy check before each async Git child; the potentially expensive Git work itself is outside the request path.
- Integration application is local-only and approval-bound. It does not run a model, push a branch or create/merge a pull request.
- An unexpected cleanup failure is retained as a failed job for operator review; no startup deletion or approval replay occurs.
- Broader runner request-routing decomposition, larger conflict types and live operator acceptance remain separate work.

## Next steps

1. Complete exact Ubuntu release validation, CI, browser acceptance and cumulative private staging for 0.48.0.
2. Continue R2 runner request-routing decomposition after the candidate is reviewable.
