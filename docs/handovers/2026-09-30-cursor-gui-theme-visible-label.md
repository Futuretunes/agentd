# 2026-09-30 — 0.215.0: Visible Appearance theme label (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Appearance theme control must show a visible Theme label
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.215.0
- Branch and base: `feat/gui-theme-visible-label` on `main` (0.214.0)
- Implementation commit(s): a7b6abf
- PR: #371

## Changes and relevant files

- Theme label is visible (no longer `sr-only`); select also sets `aria-label="Appearance theme"`.
- Package 0.215.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #371; live-installed on 192.168.1.20 (0.215.0 / a7b6abf).
- Archive SHA-256: `0e61de852109e52e4daa5cd427fcdc15b9a750f38b9167041d5b0f177126cb46`
- Revision: `a7b6abf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.214.0 / revert of #371.

## Constraints and known issues

None beyond ordinary label visibility.

## Next steps

1. Done: merged #371 and live-installed 0.215.0.
2. Add a visible History filter label next.
