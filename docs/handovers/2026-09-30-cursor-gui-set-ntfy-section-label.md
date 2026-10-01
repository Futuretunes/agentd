# 2026-09-30 — 0.329.0: Set ntfy destination accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Set ntfy destination form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.329.0
- Branch and base: `feat/gui-set-ntfy-section-label` on `main` (0.328.0)
- Implementation commit(s): 005f27c
- PR: #599

## Changes and relevant files

- Set ntfy destination form section sets `aria-label="Set ntfy destination"`.
- Package 0.329.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #599; live-installed on 192.168.1.20 (0.329.0 / 005f27cae6b5b08ed276f5954c78104045446cb1).
- Archive SHA-256: `33b13ad46727ddc9ebc082218303ad94618b8f8a7f5ae011e80088d536aa880b`
- Revision: `005f27cae6b5b08ed276f5954c78104045446cb1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.328.0 / revert of #599.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #599 and live-installed 0.329.0.
2. Label Replace managed TLS certificate next.
