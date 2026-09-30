# 2026-09-30 — 0.276.0: Configuration dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.276.0
- Branch and base: `feat/gui-configuration-head-label` on `main` (0.275.0)
- Implementation commit(s): 7b1a5b5
- PR: #493

## Changes and relevant files

- Configuration dialog `.review-head` sets `role="group"` and `aria-label="Configuration heading"`.
- Package 0.276.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #493; live-installed on 192.168.1.20 (0.276.0 / 7b1a5b52a717949cf873015b0c5a52cbd6b52553).
- Archive SHA-256: `3ce10f0ce18e069840160ed7c43efb8221cbeb9b8daa64f1201fb9c5f7bef1c1`
- Revision: `7b1a5b52a717949cf873015b0c5a52cbd6b52553`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.275.0 / revert of #493.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #493 and live-installed 0.276.0.
2. Label backups dialog heading next.
