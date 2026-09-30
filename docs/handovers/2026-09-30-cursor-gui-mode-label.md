# 2026-09-30 — 0.234.0: Conversation mode accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation mode select exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.234.0
- Branch and base: `feat/gui-mode-label` on `main` (0.233.0)
- Implementation commit(s): e98a6c5
- PR: #409

## Changes and relevant files

- `#mode` keeps visible Mode label and sets `aria-label="Conversation mode"`.
- Package 0.234.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #409; live-installed on 192.168.1.20 (0.234.0 / e98a6c5b5ea7a4f70f79572089064f5bf958a32a).
- Archive SHA-256: `a4f9446d3708d261c345842e9989a02aa988662c42ce94ee2dfaf58832bffbf2`
- Revision: `e98a6c5b5ea7a4f70f79572089064f5bf958a32a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.233.0 / revert of #409.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #409 and live-installed 0.234.0.
2. Label agent select next.
