# Shared handover — Codex and Claude

Start with [repository instructions](../AGENTS.md) and the [latest work-item handover](handovers/2026-09-28-scoped-settings.md). Claude's entry point is [CLAUDE.md](../CLAUDE.md). Both agents update these same files after every work item, including partial or blocked work.

## Open review — 2026-09-28

Claude reviewed v0.19.0: [review](reviews/2026-09-28-claude-review.md), [handover note](handovers/2026-09-28-claude-review.md). It has 4 high findings:

- **R1:** stacked unmerged PRs are what runs in production.
- **R2:** code density prevents meaningful review.
- **R3:** the deployed configuration isn't in the repo.
- **R4:** checks don't cover git-ignored files. Reproduced.

Codex should verify every finding and answer it in `docs/reviews/2026-09-28-claude-review-response.md` before starting new feature work. Accept nothing without checking it; disagree with evidence where the review is wrong.

## Open UI/UX review — 2026-09-28

Claude reviewed the task desk UI: [UX review](reviews/2026-09-28-claude-ux-review.md), [visual prototype](design/task-desk-prototype.html), [handover note](handovers/2026-09-28-claude-ux-review.md). The blockers:

- **U1:** projects without npm checks can never commit. Needs an operator decision.
- **U2:** agent answers are shown as raw Markdown in a terminal box.

The main themes are one primary action per state, removing duplicated panels, and a real design system with a proper phone layout. Answer in `docs/reviews/2026-09-28-claude-ux-review-response.md`, with the same verify-don't-accept rule.

## Current state — 2026-09-28

- **Installed release:** v0.19.0, implementation `0af41e2`, confirmed by the operator's successful deployment output; 91 tests passed and both services active.
- **Review branch:** `feat/scoped-agent-settings`, based on `feat/cursor-cli`; [draft PR #19](https://github.com/Futuretunes/agentd/pull/19), stacked on #18. Verify current remote status before acting.
- **Completed:** scoped permissions, visible inheritance, pending approval invalidation, partial-work-preserving restart, model/effort selection and next-run overrides.
- **Still unverified live:** selected-model requests and the remaining provider/GitHub acceptance journeys documented in the detailed note.
- **Next recommendation:** ntfy notifications, then GUI administration/updates/rollback. No next implementation has been assigned by this handover.
- **Security boundary:** supported installed capabilities only; Codex Chat only; no newly enabled shell, web, MCP, extra host paths or unrestricted network.

This documentation update establishes the cross-agent process and records the installed status; it makes no application changes or live model requests.

## History and maintenance

- [2026-09-28 — Claude UI/UX review](handovers/2026-09-28-claude-ux-review.md)
- [2026-09-28 — Claude review of v0.19.0](handovers/2026-09-28-claude-review.md)
- [2026-09-28 — Scoped settings and model selection](handovers/2026-09-28-scoped-settings.md)
- [Template for the next work item](handovers/TEMPLATE.md)
- [Remaining backlog](roadmap.md)

Create one dated note per work item, retain earlier notes, and update this entry point. Record implementation commit IDs; the commit containing a handover cannot include its own hash, so use Git history for documentation-only follow-ups. Never put credentials, personal account identities, raw private logs or private infrastructure addresses into these public files.
