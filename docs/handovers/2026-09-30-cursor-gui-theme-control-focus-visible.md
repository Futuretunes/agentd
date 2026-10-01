# 2026-09-30 — 0.506.0: Theme control focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Theme control focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.506.0
- Implementation commit(s): a1f96e3
- PR: #947

## Changes and relevant files

- See feature PR #947.
- Package 0.506.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #947; live-installed on 192.168.1.20 (0.506.0 / a1f96e3007b08e7121c42043aebdfa7fbd41a7e9).
- Archive SHA-256: `02f19196f9447d4297e7b4f31d3c749c979842996ff6f228a4272047a0d5ba6a`
- Revision: `a1f96e3007b08e7121c42043aebdfa7fbd41a7e9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #947.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #947 and live-installed 0.506.0.
2. Continue a11y form labels.
