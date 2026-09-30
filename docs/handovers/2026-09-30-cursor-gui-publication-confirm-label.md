# 2026-09-30 — 0.168.0: Confirm publication form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication confirmation form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.168.0
- Branch and base: `feat/gui-publication-confirm-label` on `main` (0.167.0)
- Implementation commit(s): 4033655
- PR: #277

## Changes and relevant files

- `#publication-confirm-form` aria-label "Confirm publication".
- Package 0.168.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #277; live-installed on 192.168.1.20 (0.168.0 / 4033655).
- Archive SHA-256: `d87bd3ccb2098e934eaa1ebc969c8527fe4edf969dc8f45a926c0b84efc7b470`
- Revision: `4033655184f31576afd171c90f89afd1e618ae8f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.167.0 / revert of #277.

## Constraints and known issues

- Complements Publish to GitHub form label.

## Next steps

1. Done: merged #277 and live-installed 0.168.0.
2. Continue UX polish or admin slices as operator priority allows.
