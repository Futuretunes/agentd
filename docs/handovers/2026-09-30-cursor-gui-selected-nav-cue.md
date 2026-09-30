# 2026-09-30 — 0.104.0: Selected nav non-colour cue (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Selected project/conversation rows must not rely on background colour alone; expose current page to assistive tech
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.104.0
- Branch and base: `feat/gui-selected-nav-cue` on `main` (0.103.0)
- Implementation commit(s): b92d10b
- PR: #149

## Changes and relevant files

- `.selected` adds font-weight and an inset accent bar.
- Selected project/conversation buttons set `aria-current="page"`.
- Package 0.104.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #149; live-installed on 192.168.1.20 (0.104.0 / 2ea0e20350cc).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.103.0 / revert of #149.

## Constraints and known issues

- Accent bar is decorative; `aria-current` carries the semantic selected state.
- Reduced-motion does not animate the bar (static).

## Next steps

1. Done: merged #149 and live-installed 0.104.0.
2. Continue UX polish or admin slices as operator priority allows.
