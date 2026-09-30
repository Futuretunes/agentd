# 2026-09-30 — 0.99.0: Phone touch targets + readable type (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone primary controls ≥ 44×44; composer input stays 16px to avoid iOS zoom; body status copy ≥ 15px
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.99.0
- Branch and base: `feat/gui-phone-touch-targets` on `main` (0.98.0)
- Implementation commit(s): 492637a
- PR: #139

## Changes and relevant files

- `public/style.css` phone media query: min 44px for drawer, attach, Send/Stop, header menu, run picker, suggestions, new chat and history nav.
- Prompt remains 16px on phone; turn/status muted copy 15px.
- Package 0.99.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #139; live-installed on 192.168.1.20 (0.99.0 / 0bab013afc73).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.98.0 / revert of #139.

## Constraints and known issues

- Dense secondary dialog buttons are not globally forced to 44px in this slice.
- Actual-phone operator acceptance remains separate.

## Next steps

1. Done: merged #139 and live-installed 0.99.0.
2. Continue UX polish or admin slices as operator priority allows.
