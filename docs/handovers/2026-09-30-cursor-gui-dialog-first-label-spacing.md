# 2026-09-30 — 0.221.0: Dialog first-label spacing (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: First dialog form labels sit closer under headings
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.221.0
- Branch and base: `feat/gui-dialog-first-label-spacing` on `main` (0.220.0)
- Implementation commit(s): bda148b
- PR: #383

## Changes and relevant files

- First labels after `review-head` or form `h2` drop top margin.
- Package 0.221.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #383; live-installed on 192.168.1.20 (0.221.0 / bda148bd0cbe87739a59c3b1759fad4f85ccefb8).
- Archive SHA-256: `bd2f656218f899b7782187b362f62633c120f4c67354ff673098804bf53cf284`
- Revision: `bda148bd0cbe87739a59c3b1759fad4f85ccefb8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.220.0 / revert of #383.

## Constraints and known issues

None beyond ordinary form spacing polish.

## Next steps

1. Done: merged #383 and live-installed 0.221.0.
2. Broaden first-label rule to every dialog form next.
