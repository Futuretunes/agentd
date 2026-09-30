# 2026-09-30 — 0.283.0: Create project actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Create project actions group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.283.0
- Branch and base: `feat/gui-project-actions-label` on `main` (0.282.0)
- Implementation commit(s): 79faff9
- PR: #507

## Changes and relevant files

- Create project form `.actions` sets `role="group"` and `aria-label="Create project actions"`.
- Package 0.283.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #507; live-installed on 192.168.1.20 (0.283.0 / 79faff94aee4606f0f7ef19a6b0fc09bf9f13bac).
- Archive SHA-256: `3148140c133510cfa826b4bd36487ff901e2eef5d1f8060496769a53aa199047`
- Revision: `79faff94aee4606f0f7ef19a6b0fc09bf9f13bac`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.282.0 / revert of #507.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #507 and live-installed 0.283.0.
2. Label Request revisions actions group next.
