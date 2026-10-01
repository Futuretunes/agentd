# 2026-09-30 — 0.573.0: Eyebrow section font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Eyebrow section font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.573.0
- Implementation commit(s): bc3afbd
- PR: #1080

## Changes and relevant files

- See feature PR #1080.
- Package 0.573.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1080; live-installed on 192.168.1.20 (0.573.0 / bc3afbd3df1bb42f47f9f4544a4d2ad206515b0a).
- Archive SHA-256: `b1fe0e657e3d5c1b900211304cb88b4a6227e79796111a8fa9cb060ee052bb43`
- Revision: `bc3afbd3df1bb42f47f9f4544a4d2ad206515b0a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1080.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1080 and live-installed 0.573.0.
2. Continue a11y form labels.
