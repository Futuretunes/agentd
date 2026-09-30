# 2026-09-30 — 0.89.0: Distilled approval sentence (UX-1 / U11)

- Author/agent: Cursor
- Requested outcome: Waiting-for-approval turns lead with one honest sentence plus Run/Cancel; model/effort on one line; other facts behind Details
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.89.0
- Branch and base: `feat/gui-approval-summary` on `main` (0.88.0)
- Implementation commit(s): a63cb6c
- PR: #119

## Changes and relevant files

- `approvalSentence` / `approvalModelLine` / `approvalDurationLabel` in `public/ui.js`.
- Conversation turn omits the generic “Ready when you are” muted line when execution is present; shows the sentence + model line, with existing Details disclosure unchanged.
- Package 0.89.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #119; live-installed on 192.168.1.20 (0.89.0 / cef1b208b714).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.88.0 / revert of #119.

## Constraints and known issues

- Sentence uses mode/access/filesystem cues; network and native limits remain in Details.
- Turn-level Run/Cancel ordering unchanged (primary Run first).

## Next steps

1. Done: merged #119 and live-installed 0.89.0.
2. Remaining UX-1: suggestion focus feedback / dictate honesty as separately scoped work.
