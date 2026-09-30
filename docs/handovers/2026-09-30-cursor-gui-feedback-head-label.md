# 2026-09-30 — 0.271.0: GitHub feedback dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub feedback dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.271.0
- Branch and base: `feat/gui-feedback-head-label` on `main` (0.270.0)
- Implementation commit(s): 204c1be
- PR: #483

## Changes and relevant files

- Feedback dialog `.review-head` sets `role="group"` and `aria-label="GitHub feedback heading"`.
- Package 0.271.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #483; live-installed on 192.168.1.20 (0.271.0 / 204c1bea556bf8536b4b745f43142986d92b973f).
- Archive SHA-256: `324692b13e47a76403629e9a2f802bf26ebcab07ffebe74a8ed3963b263528ff`
- Revision: `204c1bea556bf8536b4b745f43142986d92b973f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.270.0 / revert of #483.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #483 and live-installed 0.271.0.
2. Label run activity dialog heading next.
