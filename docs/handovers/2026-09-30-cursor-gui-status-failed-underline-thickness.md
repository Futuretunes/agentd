# 2026-09-30 — 0.566.0: Failed status underline thickness (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Failed status underline thickness
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.566.0
- Implementation commit(s): 7001008
- PR: #1066

## Changes and relevant files

- See feature PR #1066.
- Package 0.566.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1066; live-installed on 192.168.1.20 (0.566.0 / 7001008dc111e09e71e72879cf622fcba9c5d42c).
- Archive SHA-256: `f22d1ebe0208599e3e152f882ed9195316b7031f239c33b7fe25a8a3c066661b`
- Revision: `7001008dc111e09e71e72879cf622fcba9c5d42c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1066.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1066 and live-installed 0.566.0.
2. Continue a11y form labels.
