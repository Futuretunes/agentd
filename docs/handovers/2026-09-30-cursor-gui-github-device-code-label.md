# 2026-09-30 — 0.388.0: GitHub device code accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub device code accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.388.0
- Implementation commit(s): c891bf2
- PR: #716

## Changes and relevant files

- See feature PR #716.
- Package 0.388.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #716; live-installed on 192.168.1.20 (0.388.0 / c891bf220ce1e5baae0d56ad1d77d288e70a2318).
- Archive SHA-256: `3f8bda8a9db06869d563d480569d92ffabfe9c318d5d8fcc4d61c414f9939825`
- Revision: `c891bf220ce1e5baae0d56ad1d77d288e70a2318`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #716.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #716 and live-installed 0.388.0.
2. Continue a11y form labels.
