# 2026-09-30 — 0.197.0: Revision status accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Revision request status must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.197.0
- Branch and base: `feat/gui-revision-status-label` on `main` (0.196.0)
- Implementation commit(s): 64ece7f
- PR: #335

## Changes and relevant files

- `#revision-status` sets `aria-label="Revision status"`.
- Package 0.197.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #335; live-installed on 192.168.1.20 (0.197.0 / 64ece7f).
- Archive SHA-256: `d1a5b4c16d85a9e705904e19d99e08eb49d15b5d125a2efa8c3c0aa90b994bc3`
- Revision: `64ece7f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.196.0 / revert of #335.

## Constraints and known issues

- Complements existing polite live region / status role (0.163.0).

## Next steps

1. Done: merged #335 and live-installed 0.197.0.
2. Continue remaining a11y labeling polish.
