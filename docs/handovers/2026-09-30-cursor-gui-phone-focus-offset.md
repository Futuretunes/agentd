# 2026-09-30 — 0.524.0: Phone focus outline offset (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone focus outline offset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.524.0
- Implementation commit(s): fbc2155
- PR: #983

## Changes and relevant files

- See feature PR #983.
- Package 0.524.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #983; live-installed on 192.168.1.20 (0.524.0 / fbc215598cf2050967f004df506b99e88c4bf010).
- Archive SHA-256: `75bb84d6c62bcc5937a154327624f817e054efe037e2c32990155976fd303a48`
- Revision: `fbc215598cf2050967f004df506b99e88c4bf010`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #983.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #983 and live-installed 0.524.0.
2. Continue a11y form labels.
