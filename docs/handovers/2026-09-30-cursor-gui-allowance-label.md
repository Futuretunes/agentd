# 2026-09-30 — 0.246.0: Remaining allowance accessible name lock (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Remaining-allowance progress bars keep named remaining allowance labels
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.246.0
- Branch and base: `feat/gui-allowance-label` on `main` (0.245.0)
- Implementation commit(s): bdbf630
- PR: #433

## Changes and relevant files

- Package 0.246.0; source assertion in `test/ui.test.mjs` locks `aria-label` pattern `label + " remaining allowance"`.

## Validation evidence

- CI green on #433; live-installed on 192.168.1.20 (0.246.0 / bdbf630152ab7e6f515dd36bae3c8a12a6c87a85).
- Archive SHA-256: `335e6c84cc1672d59ccb34fb6a9678e5dc157ab4915523ce374ea4aab4540cb6`
- Revision: `bdbf630152ab7e6f515dd36bae3c8a12a6c87a85`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.245.0 / revert of #433.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #433 and live-installed 0.246.0.
2. Align dynamic field labels with muted dialog label styling next.
