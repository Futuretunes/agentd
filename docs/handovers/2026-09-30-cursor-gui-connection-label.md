# 2026-09-30 — 0.207.0: Connection status accessible name (UX-2 / U2)

- Author/agent: Cursor
- Requested outcome: Sidebar connection status must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.207.0
- Branch and base: `feat/gui-connection-label` on `main` (0.206.0)
- Implementation commit(s): e2c0e92
- PR: #355

## Changes and relevant files

- Connection status span gains `id="connection-status"` and `aria-label="Connection status"`.
- Package 0.207.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #355; live-installed on 192.168.1.20 (0.207.0 / e2c0e92).
- Archive SHA-256: `69a97ee04920d0774f4d739302ba3229697e2e2ab0b6c3e285ccee42894e60f6`
- Revision: `e2c0e92`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.206.0 / revert of #355.

## Constraints and known issues

- Complements decorative ● glyph treatment (0.112.0).

## Next steps

1. Done: merged #355 and live-installed 0.207.0.
2. Label publication confirm error next.
