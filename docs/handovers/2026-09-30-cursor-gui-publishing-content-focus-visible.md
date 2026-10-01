# 2026-09-30 — 0.472.0: Publishing content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publishing content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.472.0
- Implementation commit(s): 7aef7f7
- PR: #880

## Changes and relevant files

- See feature PR #880.
- Package 0.472.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #880; live-installed on 192.168.1.20 (0.472.0 / 7aef7f743acac13c4cab67dd642914578d51c264).
- Archive SHA-256: `c6fb68ab6347c47a6df4772808fc8572653deda33547775ed118aea799de9b5e`
- Revision: `7aef7f743acac13c4cab67dd642914578d51c264`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #880.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #880 and live-installed 0.472.0.
2. Continue a11y form labels.
