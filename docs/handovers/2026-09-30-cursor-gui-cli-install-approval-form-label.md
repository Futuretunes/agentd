# 2026-09-30 — 0.345.0: CLI install approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI install approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.345.0
- Implementation commit(s): cff5146
- PR: #631

## Changes and relevant files

- See feature PR #631.
- Package 0.345.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #631; live-installed on 192.168.1.20 (0.345.0 / cff514618e1afa42ce2d847f8528392bdada7d7e).
- Archive SHA-256: `2de2b6b224a3b4976f869ea22445c2f57250f3a1acb9e5cf21fa526f11b1ab3c`
- Revision: `cff514618e1afa42ce2d847f8528392bdada7d7e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #631.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #631 and live-installed 0.345.0.
2. Continue a11y form labels.
