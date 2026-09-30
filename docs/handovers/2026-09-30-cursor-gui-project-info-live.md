# 2026-09-30 — 0.187.0: Project information live region (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project settings info updates must announce politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.187.0
- Branch and base: `feat/gui-project-info-live` on `main` (0.186.0)
- Implementation commit(s): 9b4f5fd
- PR: #315

## Changes and relevant files

- `#project-info` sets `aria-live="polite"` (keeps Project information label).
- Package 0.187.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #315; live-installed on 192.168.1.20 (0.187.0 / 9b4f5fd).
- Archive SHA-256: `dae2c7f41ec848d8518be4b9fb8dd8e0f305a375e2bc7f53dd8305b65ed8e57d`
- Revision: `9b4f5fd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.186.0 / revert of #315.

## Constraints and known issues

- Region remains hidden until Project settings toggles it open.

## Next steps

1. Done: merged #315 and live-installed 0.187.0.
2. Continue UX polish or admin slices as operator priority allows.
