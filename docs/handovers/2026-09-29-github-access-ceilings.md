# 2026-09-29 — GitHub access ceilings and consent disclosure

- Author/agent: Codex
- Requested outcome: pick up the next backlog item after the 0.59.0 large-review gate.
- Status: implemented, cumulatively integrated, exact archive verified and Linux/CI validated; not installed or merged.
- Release: 0.60.0, task schema 2.
- Branch and base: `feat/github-access-ceilings`, cumulatively merged with `fix/codex-review-2026-09-29` after concurrent review work was detected.
- Implementation commit: `b6211ec`; cumulative exact source: `2f3ede0ec7abf5fbefcd959ad5eeea7a23f80c58`.
- PR: [#66](https://github.com/Futuretunes/agentd/pull/66), ready for review against PR #65's branch.

## Changes and relevant files

`src/github-account.ts` persists one of three runner-enforced ceilings in the native GitHub profile: repository import/update, repository plus pull-request feedback reads, or the complete workflow including separately approved draft publishing. Pre-0.60 profiles without policy metadata are restricted to repository operations. Malformed, linked or unsupported policy metadata blocks all credential-bearing GitHub operations until reconnection.

`src/repository-jobs.ts` requests repository authority. `src/publication-jobs.ts` requests feedback authority before reading PR comments and publishing authority before branch or draft-PR preparation. The browser supplies the intended ceiling before native device login; the gateway allowlist accepts only that field. Failed or cancelled sign-in keeps both the previous credentials and previous ceiling.

The GUI explicitly distinguishes GitHub CLI's standard classic OAuth grant (`repo`, `read:org`, `gist`) from AgentD's narrower local enforcement. GitHub CLI cannot subtract its default scopes: its documented `--scopes` flag adds scopes. No token-entry path, hidden account inspection or provider-side consent occurred. A selected-repository GitHub App remains the preferred future provider-side boundary.

## Validation evidence

- Typecheck and formatting passed.
- Focused GitHub account, browser error and UI tests passed.
- Cumulative full macOS suite: 203 total, 194 passed, zero failed, nine Linux-only isolation tests skipped as expected.
- Exact Ubuntu suite from the verified archive: 203/203 passed with zero failures and zero skips.
- Exact archive: version 0.60.0, task schema 2, SHA-256 `ad7c86f891940bbb59c8d146f95ef8ee164e473ff61cd59a787f2eccbc0c437a`.
- GitHub Actions runs `36571883642` and `36571888736` passed Node 24, Node 26 and required Linux isolation.

No live model request, GitHub account consent, AgentD-managed project publication, deployment, cleanup, protected-branch merge or tag occurred. The development branch and draft PR were pushed for review.

## Deployment and rollback

Production runs the verified 0.59.1/task-schema-2 baseline installed from Claude's reviewed branch. The exact cumulative archive is staged privately at `/home/c0d3x/agentd-github-access-ceilings.tar.gz`. The unexecuted managed launcher remains `/home/c0d3x/agentd-update-resources.sh`, SHA-256 `8082c52f2d5f419bf146c796edf40d9408d00f659b5e88a031ad7202ed3cfc86`; it preserves and re-verifies the installed resource and gateway-hardening profiles. Existing native profiles remain outside application rollback. After installation, an existing GitHub connection is repository-only until the operator reconnects and deliberately selects feedback or publishing access.

## Constraints and known issues

The AgentD ceiling controls trusted daemon behavior but does not reduce the OAuth token GitHub CLI receives. Compromise of the trusted service account remains bounded by that broader provider grant. Stronger provider-side repository selection needs a separately registered and reviewed GitHub App. GitHub organization/SSO policy can further constrain actual access.

## Next steps

Independently review PR #65 and PR #66, then consolidate or merge them through the protected branch. Installation remains a separate operator action; the staged launcher must not run merely for validation. The next product slice should begin the queued terminal-free Administration work with a narrowly scoped access-key rotation design, while provider-side selected-repository GitHub App support remains a separate security backlog item.
