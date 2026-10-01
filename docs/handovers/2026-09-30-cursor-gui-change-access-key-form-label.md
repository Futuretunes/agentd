# 2026-09-30 — 0.343.0: Change access key form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Change access key form exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.343.0
- Branch and base: `feat/gui-change-access-key-form-label` on `main` (0.342.0)
- Implementation commit(s): 93ef94e
- PR: #627

## Changes and relevant files

- Change access key form sets `aria-label="Change access key"`.
- Package 0.343.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #627; live-installed on 192.168.1.20 (0.343.0 / 93ef94e47cd4a926d73604312ef05c58576cee90).
- Archive SHA-256: `be01ed4cc93b344ebca7a0ce3871208cf647cbb115098385462e6a9f27cf9d69`
- Revision: `93ef94e47cd4a926d73604312ef05c58576cee90`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.342.0 / revert of #627.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #627 and live-installed 0.343.0.
2. Label Delete access-key recovery form next.
