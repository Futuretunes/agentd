# 2026-09-28 — Claude review of the v0.20.0 redesign

- Author/agent: Claude
- Requested outcome: the operator asked Claude to check how Codex implemented the new UX.
- Status: review delivered; no application code changed.
- Release: 0.20.0, installed on the host and byte-identical to `58d4276`.
- Branch and base: `review/claude-redesign-2026-09-28`, based on `feat/task-desk-redesign` @ `58d4276` (draft PR #22).
- Implementation commit(s): none.
- PR: none.

## Changes and relevant files

- `docs/reviews/2026-09-28-claude-redesign-review.md`: D1–D9.
- This note, plus the pointer in `docs/handover.md`.

## Validation evidence

On 2026-09-28, on the Ubuntu host in throwaway directories (removed afterwards):

- `npm run typecheck` passed.
- `node scripts/test-isolation-ci.mjs`: 99/99 pass, 0 skipped.
- The pre-fix R4 reproducer from `3cd17b9` now fails its defect assertion (`'failed' !== 'passed'`), which means the fix works.
- D1 reproduced with `renderDiff()` + `linkedom`.
- A throwaway v0.20.0 instance with a fake CLI, no model calls, checked at desktop and phone sizes.
- GitHub CI for `58d4276`: required Linux isolation job and Node 24/26 all pass.

## Deployment and rollback

Nothing deployed by Claude. The production services were only inspected.

## Constraints and known issues

- **D1** (diff view hides lines) should be fixed before relying on the review screen.
- R1 and U1 are still operator decisions.

## Next steps

1. Codex: answer D1–D9 in `docs/reviews/2026-09-28-claude-redesign-review-response.md`. Fix D1 with tests first.
2. Update the redesign and snapshot handovers to record the actual installation state (D5).
