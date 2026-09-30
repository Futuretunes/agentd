# 2026-09-30 — 0.269.0: Repositories dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repositories dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.269.0
- Branch and base: `feat/gui-repository-head-label` on `main` (0.268.0)
- Implementation commit(s): 9dcc7b2
- PR: #479

## Changes and relevant files

- Repository dialog `.review-head` sets `role="group"` and `aria-label="Repositories heading"`.
- Package 0.269.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #479; live-installed on 192.168.1.20 (0.269.0 / 9dcc7b2e34617507251d8119a1d921de7969c004).
- Archive SHA-256: `c11e3396c7064cc983af880940cb75a6d377364290c622c9ff56193d81dd8caa`
- Revision: `9dcc7b2e34617507251d8119a1d921de7969c004`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.268.0 / revert of #479.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #479 and live-installed 0.269.0.
2. Label publishing dialog heading next.
