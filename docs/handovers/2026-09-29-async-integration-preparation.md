# 2026-09-29 — Background integration preparation and application

- Author/agent: Codex
- Requested outcome: continue R10 by moving remaining base-integration Git preflights and approved worktree creation out of the request path
- Status: implemented and validated; staged, not installed
- Release: 0.48.0, task schema 2
- Branch and base: `feat/async-integration-application` from `feat/async-restart-preparation`
- Implementation commit: `4705736cc1f764ee6debaf40e941faac8d297750`
- PR: [draft #52](https://github.com/Futuretunes/agentd/pull/52)

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
- Exact release archive:
  - source: `4705736cc1f764ee6debaf40e941faac8d297750`
  - SHA-256: `e83f32962608e03cc5a5c18142b5dea9e6a730ed630f9c65f59d4a3e8aa8708e`
  - release verifier reported version 0.48.0, format 1 and task schema 2.
- Ubuntu VM exact-release validation, without installation:
  - clean dependency install with lifecycle scripts disabled, formatting and typecheck passed.
  - `node scripts/test-isolation-ci.mjs`: 185/185 passed, 0 failed, 0 skipped, including all Linux isolation tests.
  - private validation log: `/home/c0d3x/agentd-async-integration-preparation-tests.log`.
- GitHub CI passed for both the branch push (`36547128271`) and draft PR (`36547137514`), including Node 24, Node 26 and required Linux isolation jobs.
- Browser-facing behavior is covered by the owner-derived mobile API fixture and the manager's responsive-read/cancellation/recovery integration test. A live browser/phone acceptance pass remains separate; no provider account or model request was used.

## Deployment and rollback

- No deployment occurred. Production remains the operator-reported 0.43.0/task schema 2 baseline.
- The exact archive and cumulative launcher are staged privately on the VM. Launcher SHA-256 is `b03e68c875438e4406b8d0f85574663336a2c1b07d8ece68e3a6cad8db5d1bd9`; it was syntax checked and not executed.
- Production health was rechecked after staging and still reported 0.43.0/task schema 2.

## Constraints and known issues

- Local repository configuration validation is still a short synchronous policy check before each async Git child; the potentially expensive Git work itself is outside the request path.
- Integration application is local-only and approval-bound. It does not run a model, push a branch or create/merge a pull request.
- An unexpected cleanup failure is retained as a failed job for operator review; no startup deletion or approval replay occurs.
- Broader runner request-routing decomposition, larger conflict types and live operator acceptance remain separate work.

## Next steps

1. Continue R2 runner request-routing decomposition.
2. Keep live browser/phone acceptance and operator-controlled installation separate from implementation validation.
