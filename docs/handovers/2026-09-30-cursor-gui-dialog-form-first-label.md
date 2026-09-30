# 2026-09-30 — 0.222.0: Dialog form first-label spacing (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Every dialog form's first label drops top margin
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.222.0
- Branch and base: `feat/gui-dialog-form-first-label` on `main` (0.221.0)
- Implementation commit(s): 9a0d876
- PR: #385

## Changes and relevant files

- `dialog form > label:first-of-type` resets top margin for all dialog forms.
- Package 0.222.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #385; live-installed on 192.168.1.20 (0.222.0 / 9a0d876c6c947081aaf06e103ff0233cd1929c29).
- Archive SHA-256: `d5b97606e95083951f054e0bdc6bc5596553987f167c9120a1ed127d56e368ed`
- Revision: `9a0d876c6c947081aaf06e103ff0233cd1929c29`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.221.0 / revert of #385.

## Constraints and known issues

None beyond ordinary form spacing polish.

## Next steps

1. Done: merged #385 and live-installed 0.222.0.
2. Continue U17/a11y label polish.
