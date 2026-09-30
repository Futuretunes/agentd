# 2026-09-30 — 0.145.0: Polite live picker agent and mode tags (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Collapsed run-picker agent and mode tags must announce without opening the panel
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.145.0
- Branch and base: `feat/gui-picker-summary-live` on `main` (0.144.0)
- Implementation commit(s): ade7837
- PR: #231

## Changes and relevant files

- `#picker-summary` and `#picker-mode` set `aria-live="polite"`.
- Package 0.145.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #231; live-installed on 192.168.1.20 (0.145.0 / ade7837).
- Archive SHA-256: `b0f27bad46c2246b564e545f89e4aa9f655ae8f7b75a98bc67096347bc4757cc`
- Revision: `ade783733baba73da0a64333b85e9f89fcd719ad`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.144.0 / revert of #231.

## Constraints and known issues

- Complements selection-summary and agent-reasons live regions.

## Next steps

1. Done: merged #231 and live-installed 0.145.0.
2. Continue UX polish or admin slices as operator priority allows.
