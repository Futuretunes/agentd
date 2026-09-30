# 2026-09-30 — 0.226.0: Publication base accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication base branch input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.226.0
- Branch and base: `feat/gui-publishing-base-aria` on `main` (0.225.0)
- Implementation commit(s): 8c00c8f
- PR: #393

## Changes and relevant files

- `#publishing-base` keeps visible GitHub base branch label and sets `aria-label="Publication base branch"`.
- Package 0.226.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #393; live-installed on 192.168.1.20 (0.226.0 / 8c00c8f94fa2f1485f50873a61c370bde5a9a692).
- Archive SHA-256: `580bcb24910f436760b6c37f9f34628160422ff2e2112cd68eea191d67db1274`
- Revision: `8c00c8f94fa2f1485f50873a61c370bde5a9a692`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.225.0 / revert of #393.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #393 and live-installed 0.226.0.
2. Label feedback base branch input next.
