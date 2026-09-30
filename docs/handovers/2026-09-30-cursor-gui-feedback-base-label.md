# 2026-09-30 — 0.227.0: Feedback base accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback base branch input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.227.0
- Branch and base: `feat/gui-feedback-base-label` on `main` (0.226.0)
- Implementation commit(s): 23ef0ec
- PR: #395

## Changes and relevant files

- `#feedback-base` keeps visible Base branch to integrate label and sets `aria-label="Feedback base branch"`.
- Package 0.227.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #395; live-installed on 192.168.1.20 (0.227.0 / 23ef0ecb26a44f28df55bea5c55e5fb3fbdc294e).
- Archive SHA-256: `8a867f48c385aed345e7d5c9733779cc6a5da6406c9f79f74f1b85345e86cf2b`
- Revision: `23ef0ecb26a44f28df55bea5c55e5fb3fbdc294e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.226.0 / revert of #395.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #395 and live-installed 0.227.0.
2. Continue form control accessible-name polish.
