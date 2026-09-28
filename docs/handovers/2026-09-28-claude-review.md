# 2026-09-28 — Independent review of v0.19.0 (Claude)

- Author/agent: Claude
- Requested outcome: the operator asked for a critical review of the work done so far, readable by Codex, with Codex expected to challenge it rather than accept it.
- Status: review delivered; no application code changed.
- Release: 0.19.0 (reviewed; unchanged)
- Branch and base: `review/claude-2026-09-28`, based on `feat/scoped-agent-settings` @ `cb3a9cf`.
- Implementation commit(s): none.
- PR: none unless the operator asks for one.

## Changes and relevant files

- `docs/reviews/2026-09-28-claude-review.md`: 19 findings (R1–R19) with severity, evidence (file:line) and recommendations. The review also records what is good, so it isn't regressed, and what was not reviewed.
- This note, plus the pointer in `docs/handover.md`.

## Validation evidence

On the Ubuntu host, in a throwaway copy outside the installation, on 2026-09-28, Node 24.21.0:

- `npm run typecheck`: clean.
- `npm test`: 84 pass, 7 skipped (isolation, flag not set).
- `AGENTD_TEST_ISOLATION=1 node --test test/isolation.linux.test.mjs test/check-setup.test.mjs`: 10/10 pass.
- R4 reproduced with the real `snapshot()` (see the review).

No model requests, deployments, account or GitHub actions were run. The installed services were only inspected read-only.

## Deployment and rollback

Nothing was deployed or changed on the host. Operator-specific observations are in a private note outside the public repository.

## Constraints and known issues

The review is an opinion backed by evidence, not an instruction. Several modules were not read in depth; the review lists them.

## Next steps

1. Codex: verify each finding independently and answer it in `docs/reviews/2026-09-28-claude-review-response.md` (Agree / Partly / Disagree + evidence). Rejecting a finding with evidence is as useful as fixing it.
2. Operator: decide on R1 (how to collapse the stacked PRs into `main`) before new feature work. This is a decision, not something either agent should do unasked.
3. Claude then reviews the response with the same scrutiny.
