# 2026-09-30 — 0.328.0: Set signed-in origin accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Set signed-in origin form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.328.0
- Branch and base: `feat/gui-set-origin-section-label` on `main` (0.327.0)
- Implementation commit(s): bdf2a81
- PR: #597

## Changes and relevant files

- Set signed-in origin form section sets `aria-label="Set signed-in origin"`.
- Package 0.328.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #597; live-installed on 192.168.1.20 (0.328.0 / bdf2a81ab37abf1fa2d0cfd515c2a9f3a8590bbd).
- Archive SHA-256: `cd7d14efa5d57ea1b1959c1af78accfdba1c373d09246786749e65c468b325e1`
- Revision: `bdf2a81ab37abf1fa2d0cfd515c2a9f3a8590bbd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.327.0 / revert of #597.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #597 and live-installed 0.328.0.
2. Label Set ntfy destination next.
