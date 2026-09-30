# 2026-09-30 — 0.139.0: Decorative welcome brand mark (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Empty-conversation welcome mark must not compete with the heading for assistive tech
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.139.0
- Branch and base: `feat/gui-welcome-icon-decorative` on `main` (0.138.0)
- Implementation commit(s): 3eb89e8
- PR: #218

## Changes and relevant files

- Welcome `.welcome-icon` sets `aria-hidden="true"` around the brand mark.
- Package 0.139.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #218; live-installed on 192.168.1.20 (0.139.0 / 3eb89e8).
- Archive SHA-256: `2af7aaad85dd387c097fc16d3b431bd3be499f70e7cd0cec1321a2b7fa4d1e6e`
- Revision: `3eb89e8dce07b4c4b75fe276d1d02ff9251ad5dc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.138.0 / revert of #218.

## Constraints and known issues

- Heading and suggestion chips remain the accessible welcome content.

## Next steps

1. Done: merged #218 and live-installed 0.139.0.
2. Continue UX polish or admin slices as operator priority allows.
