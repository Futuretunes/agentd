# 2026-09-30 — 0.281.0: Request revisions dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Request revisions dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.281.0
- Branch and base: `feat/gui-revision-head-label` on `main` (0.280.0)
- Implementation commit(s): 47f441f
- PR: #503

## Changes and relevant files

- Request revisions form wraps the heading in `#revision-heading-group` with `role="group"` and `aria-label="Request revisions heading"`.
- Package 0.281.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #503; live-installed on 192.168.1.20 (0.281.0 / 47f441f9c79bf8d23fbfddcb0f34bcfc044cfbae).
- Archive SHA-256: `72f1f4fe83d7e12cbc1db2537c0965c93985c8a671e872e9aba03214b2bc21ce`
- Revision: `47f441f9c79bf8d23fbfddcb0f34bcfc044cfbae`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.280.0 / revert of #503.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #503 and live-installed 0.281.0.
2. Label Confirm publication dialog heading next.
