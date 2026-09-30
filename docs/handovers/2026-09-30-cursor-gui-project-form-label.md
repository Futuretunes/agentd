# 2026-09-30 — 0.162.0: Create project form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New project dialog form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.162.0
- Branch and base: `feat/gui-project-form-label` on `main` (0.161.0)
- Implementation commit(s): 9d7c4bd
- PR: #265

## Changes and relevant files

- `#project-form` aria-label "Create project".
- Package 0.162.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #265; live-installed on 192.168.1.20 (0.162.0 / 9d7c4bd).
- Archive SHA-256: `68f5f581f9318aedb6bb93da651b480073c02e8a797d4827fdd0a5ad499c88ee`
- Revision: `9d7c4bd1805f6605baabfa8a2600d8f007f53377`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.161.0 / revert of #265.

## Constraints and known issues

- Complements empty project CTA and Create or import control.

## Next steps

1. Done: merged #265 and live-installed 0.162.0.
2. Continue UX polish or admin slices as operator priority allows.
