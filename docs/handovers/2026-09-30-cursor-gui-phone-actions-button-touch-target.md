# 2026-09-30 — 0.581.0: Phone actions button touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone actions button touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.581.0
- Implementation commit(s): c231ab2
- PR: #1096

## Changes and relevant files

- See feature PR #1096.
- Package 0.581.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1096; live-installed on 192.168.1.20 (0.581.0 / c231ab2a1ba324431df9f3b4a8d2edc7e78ae15d).
- Archive SHA-256: `af85bbb4dad189182df651224327e512618177fea337f0e7e95501ad78417815`
- Revision: `c231ab2a1ba324431df9f3b4a8d2edc7e78ae15d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1096.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1096 and live-installed 0.581.0.
2. Continue a11y form labels.
