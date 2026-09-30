# 2026-09-30 — 0.175.0: GitHub connection status accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub connection status live region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.175.0
- Branch and base: `feat/gui-github-content-label` on `main` (0.174.0)
- Implementation commit(s): a6430b1
- PR: #291

## Changes and relevant files

- `#github-content` aria-label "GitHub connection status" (keeps aria-live polite).
- Package 0.175.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #291; live-installed on 192.168.1.20 (0.175.0 / a6430b1).
- Archive SHA-256: `d884187e1caf3df44bc4e2a2139f830114038771105f8d95bb89770e7ed83a7a`
- Revision: `a6430b1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.174.0 / revert of #291.

## Constraints and known issues

- Status cards remain dynamically rendered inside the labeled region.

## Next steps

1. Done: merged #291 and live-installed 0.175.0.
2. Continue UX polish or admin slices as operator priority allows.
