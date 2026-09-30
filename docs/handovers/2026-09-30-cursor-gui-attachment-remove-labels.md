# 2026-09-30 — 0.126.0: Attachment remove accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attached image chips must expose a clear Remove attachment accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.126.0
- Branch and base: `feat/gui-attachment-remove-labels` on `main` (0.125.0)
- Implementation commit(s): ebc3b5d
- PR: #193

## Changes and relevant files

- `#attachments` is labeled “Attached images”.
- Each chip sets `aria-label="Remove attachment: …"`.
- Package 0.126.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #193; live-installed on 192.168.1.20 (0.126.0 / 74954f3).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.125.0 / revert of #193.

## Constraints and known issues

- Visible chip text still shows `name ×` for density.

## Next steps

1. Done: merged #193 and live-installed 0.126.0.
2. Continue UX polish or admin slices as operator priority allows.
