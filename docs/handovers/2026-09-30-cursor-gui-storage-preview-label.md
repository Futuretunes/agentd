# 2026-09-30 — 0.293.0: Storage cleanup preview accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Storage cleanup preview exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.293.0
- Branch and base: `feat/gui-storage-preview-label` on `main` (0.292.0)
- Implementation commit(s): 1953281
- PR: #527

## Changes and relevant files

- Storage cleanup preview sets `aria-label="Storage cleanup preview"` and `aria-live="polite"`.
- Package 0.293.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #527; live-installed on 192.168.1.20 (0.293.0 / 195328148e62618b300afa5d536b0d33f3b458d8).
- Archive SHA-256: `88fc02e9d8db35cdc1acabe82f140fe2e2d92d13b6bf15835e893f331b0a16b9`
- Revision: `195328148e62618b300afa5d536b0d33f3b458d8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.292.0 / revert of #527.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #527 and live-installed 0.293.0.
2. Label update preview next.
