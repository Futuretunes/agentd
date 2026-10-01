# 2026-09-30 — 0.490.0: CLI settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.490.0
- Implementation commit(s): 4bc9e02
- PR: #915

## Changes and relevant files

- See feature PR #915.
- Package 0.490.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #915; live-installed on 192.168.1.20 (0.490.0 / 4bc9e021fb154d96c2cc105e03740dab0db4bff1).
- Archive SHA-256: `2bc53f58e2524cd0bdc2f55d854c1d7cc8dfd0a294d4804de86f99d212f07e35`
- Revision: `4bc9e021fb154d96c2cc105e03740dab0db4bff1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #915.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #915 and live-installed 0.490.0.
2. Continue a11y form labels.
