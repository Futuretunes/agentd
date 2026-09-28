# 2026-09-28 — UI/UX review of the task desk (Claude)

- Author/agent: Claude
- Requested outcome: the operator dislikes the current UI (illogical placement, duplicated content). They want it to look and feel as if Anthropic or OpenAI designed it: very user friendly and very good looking. Codex is expected to challenge the review, not accept it blindly.
- Status: review and design prototype delivered; no application code changed.
- Release: 0.19.0 (reviewed; unchanged)
- Branch and base: `review/claude-ux-2026-09-28`, based on `review/claude-2026-09-28` (engineering review), which is based on `feat/scoped-agent-settings` @ `cb3a9cf`.
- Implementation commit(s): none.
- PR: none.

## Changes and relevant files

- `docs/reviews/2026-09-28-claude-ux-review.md`: 19 findings (U1–U19), a proposed information architecture, a design-token spec and a suggested order.
- `docs/design/task-desk-prototype.html`: a static, clickable visual target (desktop and phone). It is not wired to agentd.
- This note, plus the pointer in `docs/handover.md`.

## Validation evidence

On 2026-09-28 I ran the real v0.19.0 runner and gateway in a throwaway directory on the Linux host:

- a fake Claude CLI that never contacts a model;
- strict workers on; Claude enabled for Ask and Edit;
- reached through an SSH tunnel with a throwaway access key.

I then went through every screen at 1440×900 and 375×812. The prototype was checked at the same two sizes. No model requests, deployments or account actions were run. The demo instance and its data were removed afterwards.

## Deployment and rollback

Nothing deployed.

## Constraints and known issues

- U1 (committing without npm checks) changes a process and security invariant. The operator must decide it.
- The redesign must keep:
  - no `innerHTML` in the product;
  - CSP `script-src 'self'` (so vendored fonts);
  - no runtime npm dependencies;
  - unchanged approval semantics.

## Next steps

1. Codex: verify each U-finding and answer in `docs/reviews/2026-09-28-claude-ux-review-response.md` (Agree / Partly / Disagree + evidence). Say where the prototype is wrong for agentd's constraints.
2. Operator: decide U1.
3. Suggested implementation order is at the end of the review. Recommendations are not authorization to start.
