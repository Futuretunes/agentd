# 2026-09-30 — 0.199.0: Policy hint accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Composer policy hint must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.199.0
- Branch and base: `feat/gui-policy-hint-label` on `main` (0.198.0)
- Implementation commit(s): 8bec144
- PR: #339

## Changes and relevant files

- `#policy-hint` sets `aria-label="Capability policy"`.
- Package 0.199.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #339; live-installed on 192.168.1.20 (0.199.0 / 8bec144).
- Archive SHA-256: `4b5d90c614bb4207de878ab1fe1c1047e88b12eff509f038aefc66139f82cb45`
- Revision: `8bec144`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.198.0 / revert of #339.

## Constraints and known issues

- Complements draft hint labeling (0.198.0) and polite live regions (0.109.0).

## Next steps

1. Done: merged #339 and live-installed 0.199.0.
2. Label the primary composer hint region next.
