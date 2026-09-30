# 2026-09-30 — 0.100.0: Disabled option reasons (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Disabled agent/mode `<option>`s must expose a reason on hover/title
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.100.0
- Branch and base: `feat/gui-disabled-option-reasons` on `main` (0.99.0)
- Implementation commit(s): 246c0f6
- PR: #141

## Changes and relevant files

- `disabledOptionReason` in `public/ui.js`.
- Composer adapter/mode options set `title` when disabled (policy/install or mode not offered).
- Package 0.100.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #141; live-installed on 192.168.1.20 (0.100.0 / 53c81fbd653c).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.99.0 / revert of #141.

## Constraints and known issues

- Native `<option>` title support varies by browser; the shared agent-reasons line remains the always-visible explanation.
- Colour-only status cues and contrast audits remain later U19 items.

## Next steps

1. Done: merged #141 and live-installed 0.100.0.
2. Continue UX polish or admin slices as operator priority allows.
