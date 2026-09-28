# Shared handover — Codex and Claude

Start with [repository instructions](../AGENTS.md) and the [latest work-item handover](handovers/2026-09-28-claude-rejoinder.md). Claude's entry point is [CLAUDE.md](../CLAUDE.md). Both agents update these same files after every work item, including partial or blocked work.

## Claude rejoinder — 2026-09-28

Claude checked Codex's response: [rejoinder](reviews/2026-09-28-claude-rejoinder.md).

- Every factual correction holds; Claude accepts them.
- All 8 reproductions confirmed independently on the host.
- GitHub shows zero reviews and zero comments on #8–#19.

Only one open question blocks progress, and it belongs to the operator: the R1 merge strategy. The rejoinder recommends one. The UX review below is still awaiting Codex's answer.

## Review response — 2026-09-28

Codex verified Claude’s findings: [response with R1–R19 and public-safe O1–O7 judgments](reviews/2026-09-28-claude-review-response.md), [bounded reproducer](reviews/2026-09-28-reproduce.mjs), [handover](handovers/2026-09-28-codex-review-response.md). Outcome: 14 Agree, 5 Partly. The ignored-file check defect was reproduced end to end with real Linux check isolation. **These findings remain unfixed.** Next recommendation is R4 + R11, with release-baseline review, formatting and reproducible deployment ahead of new features. Do not merge, deploy or weaken host policy merely because a review proposes it.

Response branch: `review/codex-response-2026-09-28`, based on Claude’s `bc4a6d6`; no application changes. Claude should independently assess the qualifications and evidence.

## Original review — 2026-09-28

Claude reviewed v0.19.0: [review](reviews/2026-09-28-claude-review.md), [handover note](handovers/2026-09-28-claude-review.md). It has 4 high findings:

- **R1:** stacked unmerged PRs are what runs in production.
- **R2:** code density prevents meaningful review.
- **R3:** the deployed configuration isn't in the repo.
- **R4:** checks don't cover git-ignored files. Reproduced.

The requested verification is recorded in the response above. Further feature work should wait for the agreed stabilization work; the operator decides the merge strategy.

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
- **Next recommendation:** exact-snapshot checks (R4) and mandatory isolation CI (R11), alongside release-baseline decisions; ntfy is deferred. No corrective implementation has been assigned by this handover.
- **Security boundary:** supported installed capabilities only; Codex Chat only; no newly enabled shell, web, MCP, extra host paths or unrestricted network.

This review-response update records findings and bounded diagnostic evidence; it makes no application changes or live model requests.

## History and maintenance

- [2026-09-28 — Claude rejoinder to Codex's response](handovers/2026-09-28-claude-rejoinder.md)
- [2026-09-28 — Claude UI/UX review](handovers/2026-09-28-claude-ux-review.md)
- [2026-09-28 — Codex response to Claude review](handovers/2026-09-28-codex-review-response.md)
- [2026-09-28 — Claude review of v0.19.0](handovers/2026-09-28-claude-review.md)
- [2026-09-28 — Scoped settings and model selection](handovers/2026-09-28-scoped-settings.md)
- [Template for the next work item](handovers/TEMPLATE.md)
- [Remaining backlog](roadmap.md)

Create one dated note per work item, retain earlier notes, and update this entry point. Record implementation commit IDs; the commit containing a handover cannot include its own hash, so use Git history for documentation-only follow-ups. Never put credentials, personal account identities, raw private logs or private infrastructure addresses into these public files.
