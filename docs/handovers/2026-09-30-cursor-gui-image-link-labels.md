# 2026-09-30 — 0.129.0: Conversation image link names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation attached-image links must expose clear Open attached image names
- Status: implemented
- Release: 0.129.0
- Branch and base: `feat/gui-image-link-labels` on `main` (0.128.0)
- Implementation commit(s): 6081e37
- PR: pending

## Changes and relevant files

- Image groups are labeled “Attached images”.
- Each link sets `aria-label="Open attached image: …"`; `img.alt` remains the filename.
- Package 0.129.0; source assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Links still open authenticated image URLs in a new tab.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
