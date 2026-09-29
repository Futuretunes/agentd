# 2026-09-29 — GitHub access ceilings and consent disclosure

- Author/agent: Codex
- Requested outcome: pick up the next backlog item after the 0.59.0 large-review gate.
- Status: implemented and locally validated; exact Linux and CI validation pending.
- Release: 0.60.0, task schema 2.
- Branch and base: `feat/github-access-ceilings`, cumulatively merged with `fix/codex-review-2026-09-29` after concurrent review work was detected.
- PR: [#66](https://github.com/Futuretunes/agentd/pull/66), intended to target PR #65's branch after the cumulative merge is pushed.

## Changes and relevant files

`src/github-account.ts` persists one of three runner-enforced ceilings in the native GitHub profile: repository import/update, repository plus pull-request feedback reads, or the complete workflow including separately approved draft publishing. Pre-0.60 profiles without policy metadata are restricted to repository operations. Malformed, linked or unsupported policy metadata blocks all credential-bearing GitHub operations until reconnection.

`src/repository-jobs.ts` requests repository authority. `src/publication-jobs.ts` requests feedback authority before reading PR comments and publishing authority before branch or draft-PR preparation. The browser supplies the intended ceiling before native device login; the gateway allowlist accepts only that field. Failed or cancelled sign-in keeps both the previous credentials and previous ceiling.

The GUI explicitly distinguishes GitHub CLI's standard classic OAuth grant (`repo`, `read:org`, `gist`) from AgentD's narrower local enforcement. GitHub CLI cannot subtract its default scopes: its documented `--scopes` flag adds scopes. No token-entry path, hidden account inspection or provider-side consent occurred. A selected-repository GitHub App remains the preferred future provider-side boundary.

## Validation evidence

- Typecheck and formatting passed.
- Focused GitHub account, browser error and UI tests passed.
- Full macOS suite: 201 total, 192 passed, zero failed, nine Linux-only isolation tests skipped as expected.
- Exact Ubuntu zero-skip validation and GitHub Node 24/26/Linux CI remain pending.

No live model request, GitHub account consent, repository publication, deployment, cleanup, merge or tag occurred.

## Deployment and rollback

Production runs the verified 0.59.1/task-schema-2 baseline installed from Claude's reviewed branch. No 0.60.0 archive or launcher has been staged yet. Existing native profiles must remain outside application rollback. After installation, an existing GitHub connection is repository-only until the operator reconnects and deliberately selects feedback or publishing access.

## Constraints and known issues

The AgentD ceiling controls trusted daemon behavior but does not reduce the OAuth token GitHub CLI receives. Compromise of the trusted service account remains bounded by that broader provider grant. Stronger provider-side repository selection needs a separately registered and reviewed GitHub App. GitHub organization/SSO policy can further constrain actual access.

## Next steps

Complete the cumulative merge with Claude's 0.59.1 review fixes, retarget PR #66 to PR #65, build the exact archive, run required Ubuntu validation and CI, then update this handover and the staged installer. Independent review and consolidation of the remaining stack remain open.
