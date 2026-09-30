# 2026-09-30 — 0.114.0: Send/Stop accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer Send and Stop/Cancel expose names that do not depend on ↑ / ■ glyphs
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.114.0
- Branch and base: `feat/gui-send-stop-labels` on `main` (0.113.0)
- Implementation commit(s): 925990f
- PR: #169

## Changes and relevant files

- `#send` has `aria-label="Send message"`.
- `composerStopControl` adds `accessibleName`; `#stop-current` applies it on refresh.
- Package 0.114.0; unit/HTML coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #169; live-installed on 192.168.1.20 (0.114.0 / baed961).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.113.0 / revert of #169.

## Constraints and known issues

- Visible labels still use ■ / ↑ for sighted density; AT uses aria-label.

## Next steps

1. Done: merged #169 and live-installed 0.114.0.
2. Continue UX polish or admin slices as operator priority allows.
