# 2026-09-30 — 0.188.0: Phone drawer left safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone navigation drawer must clear the left safe-area inset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.188.0
- Branch and base: `feat/gui-drawer-safe-area-left` on `main` (0.187.0)
- Implementation commit(s): f21adae
- PR: #317

## Changes and relevant files

- Phone `#sidebar` sets `padding-left: max(0px, env(safe-area-inset-left))`.
- Package 0.188.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #317; live-installed on 192.168.1.20 (0.188.0 / f21adae).
- Archive SHA-256: `724c7ac623f73c25b1a5050ae0185d0efe74bd9b4a5e5e21d50cdac24ddeb5ce`
- Revision: `f21adae`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.187.0 / revert of #317.

## Constraints and known issues

- Complements existing top/bottom drawer safe-area insets.

## Next steps

1. Done: merged #317 and live-installed 0.188.0.
2. Continue UX polish or admin slices as operator priority allows.
