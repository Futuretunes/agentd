# 2026-09-30 — 0.420.0: Login control focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Login control focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.420.0
- Implementation commit(s): ccd72ca
- PR: #780

## Changes and relevant files

- See feature PR #780.
- Package 0.420.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #780; live-installed on 192.168.1.20 (0.420.0 / ccd72ca891a01fb185d717ca0abee4c6e1fad615).
- Archive SHA-256: `5e7b1a806a654ceb763c366433661936e6eb72e8422fda1adda4d3953adc2b2e`
- Revision: `ccd72ca891a01fb185d717ca0abee4c6e1fad615`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #780.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #780 and live-installed 0.420.0.
2. Continue a11y form labels.
