# 2026-09-30 — 0.362.0: Managed runtime flags form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Managed runtime flags form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.362.0
- Implementation commit(s): a39adcc
- PR: #665

## Changes and relevant files

- See feature PR #665.
- Package 0.362.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #665; live-installed on 192.168.1.20 (0.362.0 / a39adccdde8d68f6c72bf0f030aec07b202f20eb).
- Archive SHA-256: `c9c1d1685cf70c7b0c6fe3e3eadde996809e873f11b16674bd8d6b1dae092e1a`
- Revision: `a39adccdde8d68f6c72bf0f030aec07b202f20eb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #665.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #665 and live-installed 0.362.0.
2. Continue a11y form labels.
