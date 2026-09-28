# 2026-09-28 — Shared Git policy

- Author: Codex; authorized overnight backlog continuation, R12.
- Release: 0.25.0 cumulative candidate, task schema 1; includes R6/R7.
- Branch: `feat/shared-git-policy`, based on `feat/worker-hardening` at `42e032b`.
- Status: implemented; exact Linux/CI verified. Not installed.

## Changes and boundaries

`src/git-policy.ts` owns runtime Git flags, minimal environment, bounded synchronous execution and repository configuration checks. Runner worktrees, snapshots/check trees, integration previews, size admission, retention, and asynchronous import/pull/publishing transport use it. No inherited Git config injection, SSH command, token, executable path, preload or external-diff environment is passed. Temporary index paths remain an explicit snapshot-only override. Local HTTPS is denied; the existing GitHub transport explicitly enables it with its pinned DNS and native credential helper. Repository includes, executable filters/merge/diff drivers and transport overrides fail closed; ordinary configured hooks and fsmonitor are overridden. Local and enabled worktree configuration are both checked, using Git's explicit worktreeConfig extension setting. Missing repositories are accepted only for init/clone destinations; other configuration errors fail closed.

No permissions, provider policy, branch protections, account consent, live repository publication or production configuration changed. Custom Git configurations may now require manual review/removal before project operations. Checks are repeated, not cached. The trusted daemon owns Git metadata; this is not a lock against another administrator changing configuration concurrently. Release-building Git in the trusted developer tooling remains separate from runtime policy.

## Validation

18 focused local tests passed, covering snapshot exclusions, revisions, integration, GitHub import/update, hooks, inherited configuration and custom driver/include/rewrite refusal. Typecheck passed before final staging. Exact archive `0373bf9` passed typecheck and 122/122 Linux tests, zero skips/failures. CI `36477760747` passed. Archive SHA256 `85b236854e85f79c7bff4cfd651abc24b8ddd6bd9542672c8ba86eacab2a0ace`. [Draft #28](https://github.com/Futuretunes/agentd/pull/28) targets the worker-hardening branch. No model requests or deployment.

## Deployment/rollback and next

Use the eventual cumulative managed archive plus explicit resource profile migration. No R12-specific migration. Installed 0.22.0 remains unchanged. Continue R13 shared filename/content safety across review and publishing. Keep handovers current after each item.
