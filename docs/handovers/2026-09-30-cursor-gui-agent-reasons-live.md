# 2026-09-30 — 0.138.0: Polite live agent capability reasons (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent capability/disabled reasons in the picker must announce without requiring focus
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.138.0
- Branch and base: `feat/gui-agent-reasons-live` on `main` (0.137.0)
- Implementation commit(s): d4af1e2
- PR: #216

## Changes and relevant files

- `#agent-reasons` sets `aria-live="polite"`.
- Package 0.138.0; live-region coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #216; live-installed on 192.168.1.20 (0.138.0 / d4af1e2).
- Archive SHA-256: `cd65c8531edde01b7beb5422737cf3ae319c781e816c53e8bbe6f46db32644cb`
- Revision: `d4af1e26a7c3b932357fff38c18b1ddc54eb48f9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.137.0 / revert of #216.

## Constraints and known issues

- Reasons remain muted visual copy; live region mirrors composer hint behavior.

## Next steps

1. Done: merged #216 and live-installed 0.138.0.
2. Continue UX polish or admin slices as operator priority allows.
