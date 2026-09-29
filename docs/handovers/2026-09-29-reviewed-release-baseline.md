# 2026-09-29 — Request routing and cumulative review baseline

- Author/agent: Codex
- Requested outcome: finish runner request-routing decomposition, consolidate the stacked work into one reviewed release baseline, then stop.
- Status: implemented, exact archive verified, Linux validated and staged; not installed or merged.
- Release: 0.49.0, task schema 2.
- Branch and base: `release/0.49.0-reviewed-baseline` from cumulative 0.48.0; PR #53 targets `main` directly and is ready for independent review.
- Implementation commit: `e96027df8c5f18be4b08a56a8453290ac8565eb0`.
- PR: https://github.com/Futuretunes/agentd/pull/53

## Changes and relevant files

`src/request-routing.ts` adds a startup-built operation table with explicit route ownership. Duplicate operation claims fail before the service accepts requests. `src/runner.ts` now routes the fifteen review, check, commit, revision and restart preparation operations through a dedicated handler; the remaining request path stays behind the core handler. Closing-state rejection and browser/local audit context still wrap dispatch, while the existing approval, admission, ownership, exact-tree and cancellation checks remain in their original domain code. `test/request-routing.test.mjs` verifies complete preparation-domain routing, duplicate refusal and fail-closed fallback validation.

The release branch is the single cumulative review surface for the formerly linear #8–#52 stack. PR #53 targets `main`, documents that it supersedes the stack and retains all Git history. After this handover first landed, #8–#52 were closed with links to #53; their commits and discussion remain available. No squash, rebase, merge or default-branch update occurred.

## Validation evidence

- `npm run typecheck`: passed.
- `npm run format:check`: passed.
- macOS full suite: 179 passed, 0 failed; nine Linux-only isolation tests skipped as expected.
- GitHub Actions runs `36549512654` and `36549549839`: Node 24, Node 26 and Required Linux isolation all passed.
- Required Ubuntu 24.04 isolation: 188/188 passed, zero failures and zero skips.
- Exact deterministic archive for implementation commit: version 0.49.0, format 1, task schema 2; SHA-256 `d52e685428cc44e5492ce039c998f0ecb54283a1ce749ca91ddc919564301650`.
- `git diff --check`: passed before the implementation commit.

No live model request, account consent, GitHub publication through AgentD, storage cleanup or production deployment was used for validation. Phone acceptance remains separate.

## Deployment and rollback

Production remains healthy on 0.43.0/task schema 2 with starts 38. The exact archive and syntax-checked cumulative launcher are staged privately on the VM. Their remote hashes match the operator copies; the launcher was not executed. It uses the tracked managed updater followed by the existing tracked resource migration. A schema-2 rollback still requires the matching saved application and task-state backup; native credentials remain outside rollback.

## Constraints and known issues

This completes the bounded request-routing item by giving the preparation domain explicit, testable ownership. The core handler is still large; future product work can extract additional domains through the same table without changing public operations. A green cumulative PR is a review baseline, not authorization to merge or deploy. Branch protection, signed provenance and an independent human/Claude review remain release decisions.

The baseline contains 117 commits relative to `main` because the project intentionally preserved the development history. PR #53 is the one cumulative review and integration point. Historical stacked PRs should no longer be merged individually.

## Next steps

Stop here as requested. When work resumes: independently review PR #53, decide merge strategy and branch protection, then merge/tag only with explicit operator authorization. After that, continue the remaining roadmap from the new baseline rather than any historical stack branch.
