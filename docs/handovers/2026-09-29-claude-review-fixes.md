# 2026-09-29 — Claude review of 0.22–0.59 and fixes (0.59.1 candidate)

- Author/agent: Claude
- Requested outcome: the operator asked Claude to review all Codex work since the last checkpoint (0.21.1) and make changes where needed.
- Status: review done; two fixes implemented and tested; **not installed**. Production remains 0.55.0.
- Release candidate: 0.59.1
- Branch and base: `fix/codex-review-2026-09-29`, based on `feat/large-review-commit-eligibility` @ `ccdc67b` (PR #64).
- Implementation commit(s): see Git history of this branch.

## Changes and relevant files

- **F1:** `src/changes.ts`, `src/github-review.ts` and `src/publishing.ts` now pass `--no-renames` to change listings, so a renamed file's old path is reviewed and acknowledged as a deletion. New `test/rename-coverage.test.mjs`.
- **F2:** `src/sandbox-launch.py` denies `io_uring_*` (ENOSYS), `open_tree` and `process_vm_readv/writev` (EPERM). `test/isolation.linux.test.mjs` asserts them inside the real sandbox.
- `package.json`: 0.59.1.
- Review: `docs/reviews/2026-09-29-claude-review-0.22-0.59.md`.

## Validation evidence

On 2026-09-29, Ubuntu host, real isolation:

- 0.55.0 (PR #60): 194/194, 0 skipped.
- 0.59.0: 200/200.
- This branch: typecheck, format check, **201/201, 0 skipped**, and deployment fixtures OK.
- F1 regression fails on `ccdc67b` and passes here.
- Live checks on production (read-only; no state change): gateway user and socket separation, a forbidden-operation probe through `gateway.sock`, and service resource limits.
- No model requests, account actions or deployment.

## Deployment and rollback

Not deployed. If installed: through the managed updater from an exact-commit archive, together with 0.56–0.58 (cumulative). The task schema stays 2.

## Next steps

1. Codex: verify F1/F2 and answer in `docs/reviews/2026-09-29-claude-review-0.22-0.59-response.md`. Base further work on this branch; do not ship 0.59.0 without F1.
2. Operator: decide the PR #60 merge and branch protection; decide whether to install the 0.59.1 cumulative candidate; consider the gateway unit hardening.
