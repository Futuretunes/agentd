# 2026-09-30 — 0.85.0: Bounded live output while running (UX-3)

- Author/agent: Cursor
- Requested outcome: Show a bounded current-output tail in the conversation while a run is active; reuse existing 3s poll + logTail payload; no websockets or new backend fields
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.85.0
- Branch and base: `feat/gui-live-output` on `main` (0.84.0)
- Implementation commit(s): 
- PR: #111

## Changes and relevant files

- Active turns (`pending` statuses) with non-empty `output` render a plain-text `<pre class="result live-output">` preview instead of only “Waiting for the agent’s response…”.
- Client helper `liveOutputPreview` in `public/ui.js` strips ANSI, caps ~6 KB at a trailing line boundary, and never interprets HTML/Markdown (textContent only).
- Server still supplies up to 60 KB via existing `logTail` on conversation-show; Activity dialog / download unchanged (60 KB / 512 KB).
- CSS caps inline preview height at ~28vh. Unit coverage in `test/ui.test.mjs`. Package bumped to 0.85.0.
- Did not touch live-install docs for 0.84.

## Validation evidence

- CI green on #111; live-installed on 192.168.1.20 (0.85.0 / e8da1a64e3fc).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.84.0 / revert of #111.

## Constraints and known issues

- Preview is the latest log bytes, not a separate “assistant stream”; tool noise remains visible until a final answer exists.
- Waiting-for-approval without log output still uses the prior ready copy.

## Next steps

1. Done: merged #111 and live-installed 0.85.0.
2. Remaining UX-3: composer Stop for active runs / change-review polish as separately scoped work.
