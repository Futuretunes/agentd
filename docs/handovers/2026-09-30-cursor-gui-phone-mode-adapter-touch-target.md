# 2026-09-30 — 0.536.0: Phone mode adapter touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone mode adapter touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.536.0
- Implementation commit(s): 4c9a75d
- PR: #1006

## Changes and relevant files

- See feature PR #1006.
- Package 0.536.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1006; live-installed on 192.168.1.20 (0.536.0 / 4c9a75db304364e0e75d327a537fcca521ccd5bc).
- Archive SHA-256: `de34e1c0e9769b60e788d5a0064f66cb3de340e759fefdf70316df2fdd73e360`
- Revision: `4c9a75db304364e0e75d327a537fcca521ccd5bc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1006.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1006 and live-installed 0.536.0.
2. Continue a11y form labels.
