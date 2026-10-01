# 2026-09-30 — 0.561.0: Phone diff line font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone diff line font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.561.0
- Implementation commit(s): 6b04452
- PR: #1056

## Changes and relevant files

- See feature PR #1056.
- Package 0.561.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1056; live-installed on 192.168.1.20 (0.561.0 / 6b04452af72c61c267cb297a9460ccaefcc66003).
- Archive SHA-256: `43970a616017b7331f7f48405c3da20c9016be131732d266d6da63c20d9e3825`
- Revision: `6b04452af72c61c267cb297a9460ccaefcc66003`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1056.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1056 and live-installed 0.561.0.
2. Continue a11y form labels.
