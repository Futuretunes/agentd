# 2026-09-30 — 0.354.0: Apply runtime flags approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Apply runtime flags approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.354.0
- Implementation commit(s): c83c899
- PR: #649

## Changes and relevant files

- See feature PR #649.
- Package 0.354.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #649; live-installed on 192.168.1.20 (0.354.0 / c83c899b270ce3d47e477bf4ae446ad3162efb0e).
- Archive SHA-256: `ef090e662f438c156120b7137314549c96c5e0702fcca6c5f81c07bc4b1f7049`
- Revision: `c83c899b270ce3d47e477bf4ae446ad3162efb0e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #649.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #649 and live-installed 0.354.0.
2. Continue a11y form labels.
