# 2026-09-30 — 0.95.0: New project dialog layout + composer fade (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: New project must not place Import beside the Project name label; conversation content should not vanish under the composer without a fade
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.95.0
- Branch and base: `feat/gui-new-project-layout` on `main` (0.94.0)
- Implementation commit(s): 14355e3
- PR: #131

## Changes and relevant files

- `public/index.html`: New project form is name → help → Create, then Import as an alternative.
- `public/style.css`: `#project-form` grid; composer wrap top fade over scrolling conversation.
- Package 0.95.0; form-order assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #131; live-installed on 192.168.1.20 (0.95.0 / 056659cf5287).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.94.0 / revert of #131.

## Constraints and known issues

- Approval disclosure triangles and project badge explanation remain later U17 items.
- Fade uses `var(--bg)`; reduced-motion preferences leave the fade static (no animation).

## Next steps

1. Done: merged #131 and live-installed 0.95.0.
2. Continue UX polish or admin slices as operator priority allows.
