# 2026-09-30 — 0.89.0: Distilled approval sentence (UX-1 / U11)

- Author/agent: Cursor
- Requested outcome: Waiting-for-approval turns lead with one honest sentence plus Run/Cancel; model/effort on one line; other facts behind Details
- Status: implemented
- Release: 0.89.0
- Branch and base: `feat/gui-approval-summary` on `main` (0.88.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `approvalSentence` / `approvalModelLine` / `approvalDurationLabel` in `public/ui.js`.
- Conversation turn omits the generic “Ready when you are” muted line when execution is present; shows the sentence + model line, with existing Details disclosure unchanged.
- Package 0.89.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Sentence uses mode/access/filesystem cues; network and native limits remain in Details.
- Turn-level Run/Cancel ordering unchanged (primary Run first).

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Remaining UX-1: dictate honesty / suggestion focus feedback as separately scoped work.
