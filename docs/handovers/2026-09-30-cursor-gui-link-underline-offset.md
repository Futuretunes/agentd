# 2026-09-30 — 0.601.0: Link underline offset (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Link underline offset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.601.0
- Implementation commit(s): fd3ccfb
- PR: #1136

## Changes and relevant files

- See feature PR #1136.
- Package 0.601.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1136; live-installed on 192.168.1.20 (0.601.0 / fd3ccfbca059fb807ac5fe4c6d97e37300bc039b).
- Archive SHA-256: `363be8aa3bb9881445f1c69a7942aa807cfc9b880c3a00c9b464baae7bfc7515`
- Revision: `fd3ccfbca059fb807ac5fe4c6d97e37300bc039b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1136.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1136 and live-installed 0.601.0.
2. Continue a11y form labels.
