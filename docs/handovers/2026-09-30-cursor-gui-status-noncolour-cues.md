# 2026-09-30 — 0.102.0: Non-colour status cues (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Status and outcome styles must not rely on colour alone
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.102.0
- Branch and base: `feat/gui-status-noncolour-cues` on `main` (0.101.0)
- Implementation commit(s): 26f78aa
- PR: #145

## Changes and relevant files

- Active statuses use weight 600; failure statuses also underline; `.good` / `.attention` gain weight.
- Package 0.102.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #145; live-installed on 192.168.1.20 (0.102.0 / e5e2313840fa).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.101.0 / revert of #145.

## Constraints and known issues

- Text labels remain the primary signal; weight/underline reinforce them.
- Full contrast audit of every muted pair remains a separate check.

## Next steps

1. Done: merged #145 and live-installed 0.102.0.
2. Continue UX polish or admin slices as operator priority allows.
