# 2026-09-30 — 0.331.0: Managed runtime flags form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Managed runtime flags form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.331.0
- Branch and base: `feat/gui-runtime-flags-form-label` on `main` (0.330.0)
- Implementation commit(s): aff56e8
- PR: #603

## Changes and relevant files

- Managed runtime flags form section sets `aria-label="Managed runtime flags"`.
- Package 0.331.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #603; live-installed on 192.168.1.20 (0.331.0 / aff56e8aae8ae4a4fd3e9e87c3ca57221f28ac8f).
- Archive SHA-256: `5807f7c6806f1afb0d2351d53d37118930b65b4a952e8250f69807710381dd46`
- Revision: `aff56e8aae8ae4a4fd3e9e87c3ca57221f28ac8f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.330.0 / revert of #603.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #603 and live-installed 0.331.0.
2. Label Enabled adapters next.
