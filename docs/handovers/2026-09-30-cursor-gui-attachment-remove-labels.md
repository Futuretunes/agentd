# 2026-09-30 — 0.126.0: Attachment remove accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attached image chips must expose a clear Remove attachment accessible name
- Status: implemented
- Release: 0.126.0
- Branch and base: `feat/gui-attachment-remove-labels` on `main` (0.125.0)
- Implementation commit(s): 657c15d
- PR: pending

## Changes and relevant files

- `#attachments` is labeled “Attached images”.
- Each chip sets `aria-label="Remove attachment: …"`.
- Package 0.126.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Visible chip text still shows `name ×` for density.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
