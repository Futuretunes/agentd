# 2026-09-30 — 0.298.0: History result actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History search result actions expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.298.0
- Branch and base: `feat/gui-history-result-actions-label` on `main` (0.297.0)
- Implementation commit(s): 16d75fe
- PR: #537

## Changes and relevant files

- History result `.actions` sets `role="group"` and `aria-label="History result actions"`.
- Package 0.298.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #537; live-installed on 192.168.1.20 (0.298.0 / 16d75fe08beda7ec777b22a040fbc67e6598e7be).
- Archive SHA-256: `3cdc10b4d70b8e44f5e70544a53b5785caf85d09b2ff80f24f5f2a61979e6874`
- Revision: `16d75fe08beda7ec777b22a040fbc67e6598e7be`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.297.0 / revert of #537.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #537 and live-installed 0.298.0.
2. Label adapter account actions next.
