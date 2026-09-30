# 2026-09-30 — 0.129.0: Conversation image link names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation attached-image links must expose clear Open attached image names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.129.0
- Branch and base: `feat/gui-image-link-labels` on `main` (0.128.0)
- Implementation commit(s): 13aa2d5
- PR: #199

## Changes and relevant files

- Image groups are labeled “Attached images”.
- Each link sets `aria-label="Open attached image: …"`; `img.alt` remains the filename.
- Package 0.129.0; source assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #199; live-installed on 192.168.1.20 (0.129.0 / d2ed79d).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.128.0 / revert of #199.

## Constraints and known issues

- Links still open authenticated image URLs in a new tab.

## Next steps

1. Done: merged #199 and live-installed 0.129.0.
2. Continue UX polish or admin slices as operator priority allows.
