# 2026-09-30 — 0.252.0: Conversation title accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation title exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.252.0
- Branch and base: `feat/gui-thread-title-label` on `main` (0.251.0)
- Implementation commit(s): de58f5e
- PR: #445

## Changes and relevant files

- `#thread-title` sets `aria-label="Conversation title"` and keeps `aria-describedby="project-name"`.
- Package 0.252.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #445; live-installed on 192.168.1.20 (0.252.0 / de58f5e1874fe728539aecec21c9c9f2a98b83d6).
- Archive SHA-256: `d265c72f2a4de919fe9ad436296b56866012340e081b8112411d99076380a572`
- Revision: `de58f5e1874fe728539aecec21c9c9f2a98b83d6`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.251.0 / revert of #445.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #445 and live-installed 0.252.0.
2. Label conversation heading group next.
