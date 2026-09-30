# 2026-09-30 — 0.204.0: Picker mode accessible name (UX-2 / U2)

- Author/agent: Cursor
- Requested outcome: Collapsed picker mode tag must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.204.0
- Branch and base: `feat/gui-picker-mode-label` on `main` (0.203.0)
- Implementation commit(s): b2ef6fe
- PR: #349

## Changes and relevant files

- `#picker-mode` sets `aria-label="Selected mode"`.
- Package 0.204.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #349; live-installed on 192.168.1.20 (0.204.0 / b2ef6fe).
- Archive SHA-256: `2a7b1e04c844274f88e274f5c5d5c67dbbbfbbe5cf20bf1733a8aff04811247d`
- Revision: `b2ef6fe`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.203.0 / revert of #349.

## Constraints and known issues

- Complements polite live announcements on the same element (0.145.0).

## Next steps

1. Done: merged #349 and live-installed 0.204.0.
2. Label review change stats next.
