# 2026-09-30 — 0.236.0: Access key input accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in access key input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.236.0
- Branch and base: `feat/gui-key-label` on `main` (0.235.0)
- Implementation commit(s): 98e4e93
- PR: #413

## Changes and relevant files

- `#key` keeps visible Access key label and sets `aria-label="Access key"`.
- Package 0.236.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #413; live-installed on 192.168.1.20 (0.236.0 / 0c135ff32a5f7ce2035446f9313809fba1b4d4fb).
- Archive SHA-256: `cdb92da0386bec548b29e94fce973cdb5c082c7283a5993a261ced588121c229`
- Revision: `0c135ff32a5f7ce2035446f9313809fba1b4d4fb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.235.0 / revert of #413.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #413 and live-installed 0.236.0.
2. Label history search input next.
