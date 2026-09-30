# 2026-09-30 — 0.118.0: Code copy feedback + theme-color (UX-1 / UX-4)

- Author/agent: Cursor
- Requested outcome: Code Copy announces success politely and phone Copy targets stay ≥44px; browser chrome theme-color follows appearance
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.118.0
- Branch and base: `feat/gui-copy-code-a11y` on `main` (0.117.0)
- Implementation commit(s): ab7f0f7
- PR: #177

## Changes and relevant files

- Answer code Copy uses `aria-label` + `aria-live="polite"` and resets to “Copy code” after 2s.
- Phone `.code-head button` is at least 44×44.
- `setupShell` updates `meta[name=theme-color]` for light/dark (including system preference changes).
- Package 0.118.0; coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #177; live-installed on 192.168.1.20 (0.118.0 / 351506e).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.117.0 / revert of #177.

## Constraints and known issues

- Clipboard API failures still show “Select code to copy” and then reset.

## Next steps

1. Done: merged #177 and live-installed 0.118.0.
2. Continue UX polish or admin slices as operator priority allows.
