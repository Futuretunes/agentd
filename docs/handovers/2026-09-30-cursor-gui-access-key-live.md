# 2026-09-30 — 0.170.0: Access-key settings live region (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Change access key panel updates must announce politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.170.0
- Branch and base: `feat/gui-access-key-live` on `main` (0.169.0)
- Implementation commit(s): caa9377
- PR: #281

## Changes and relevant files

- `#access-key-content` sets `aria-live="polite"`.
- Package 0.170.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #281; live-installed on 192.168.1.20 (0.170.0 / caa9377).
- Archive SHA-256: `75d6452291161b22a4cb0d6b98c43b283d51cb0e2f99d42728beac8b0b2d7fc2`
- Revision: `caa937700f88fd910a94c80173c1bc5ae42297dd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.169.0 / revert of #281.

## Constraints and known issues

- Complements existing settings dialog labelling; content is filled dynamically.

## Next steps

1. Done: merged #281 and live-installed 0.170.0.
2. Continue UX polish or admin slices as operator priority allows.
