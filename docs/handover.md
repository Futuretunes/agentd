# Shared handover — Codex and Claude

Start with [repository instructions](../AGENTS.md) and the [latest work-item handover](handovers/2026-09-28-managed-deployment.md). Claude's entry point is [CLAUDE.md](../CLAUDE.md). Both agents update these same files after every work item, including partial or blocked work.

## Candidate 0.21.0 — managed deployment and task schema

Current work: [handover](handovers/2026-09-28-managed-deployment.md), [draft PR #23](https://github.com/Futuretunes/agentd/pull/23). The initial `a58f364` installer refused the gateway personality setting before deployment; the tested role-specific correction `af7ca04` is staged, with 105/105 Linux tests and all CI jobs passing. A second preflight refusal revealed omitted mobile defaults; corrected candidate `8b7c4a2` is staged and matches runtime defaults while rejecting explicit mismatches (105/105 Linux tests and all CI jobs passed). See the handover follow-ups. Installed 0.20.0 was independently confirmed through loopback health and both services active on 2026-09-28; earlier installation statements below are historical. Candidate 0.21.0 adds transactional task-schema migration, exact-commit release packaging and a tracked administrator-only updater with configuration drift checks and rollback. No production deployment occurred. Candidate validation: typecheck and 105/105 Linux tests, zero skips; root deployment remains operator acceptance. Release-baseline merge strategy and protected-branch enforcement remain unresolved; no main merge is authorized by this note.

## Candidate 0.20.0 — implementation ready

UI redesign and R4 exact-tree checks are implemented. Linux validation: **99 passed, zero failures/skips**. R11 now has a non-skipping isolation CI job; protected-branch enforcement still needs configuration. See [snapshot-check handover](handovers/2026-09-28-snapshot-checks.md) and [UI handover](handovers/2026-09-28-task-desk-redesign.md). Candidate is staged; installed 0.19.0 remains unchanged until the administrator update. Old passing checks will require fresh verification, including before publishing historical commits. Next: operator acceptance and reviewed release baseline, then reproducible deployment/schema work. Earlier “unfixed” statements below describe the reviewed baseline.

## UI redesign — operator priority change

The operator requested UI/UX implementation immediately, followed by the backlog. Candidate 0.20.0 implements the conversation-first redesign; see [handover](handovers/2026-09-28-task-desk-redesign.md). Installed 0.19.0 is unchanged. Next work is R4/R11. Earlier ordering recommendations are superseded by this explicit request; security and approval invariants remain.

## Codex follow-up — 2026-09-28

Read Claude's consolidated rejoinders at `3735109`. UX corrections and implementation order are now mutually agreed. The backlog explicitly includes truthful New project prerequisite copy and one-click raw logs/downloads. Claude records operator approval of the prototype visual direction; preserve that recorded preference. Sampled revised token pairs pass normal-text contrast, but this is not a full accessibility certification. No application changes, merge to main or deployment occurred. See [follow-up handover](handovers/2026-09-28-ux-rejoinder-assessment.md).

## Claude rejoinders — 2026-09-28

- **Engineering:** [rejoinder](reviews/2026-09-28-claude-rejoinder.md).
  - Every factual correction in Codex's response holds, and all 8 reproductions were confirmed independently on the host.
  - GitHub shows zero reviews and zero comments on #8–#19.
  - The rejoinder recommends an R1 merge strategy for the operator.
- **UX:** [rejoinder](reviews/2026-09-28-claude-ux-rejoinder.md).
  - Codex's UX pushbacks were verified and accepted: U15 focus works, sidebar names exist, current contrast passes, polling exists.
  - The prototype's light-theme contrast failures are fixed.
  - The backlog order is agreed.

**Operator decision, 2026-09-28: visual direction approved.** The operator confirmed the prototype's look ([`docs/design/task-desk-prototype.html`](design/task-desk-prototype.html)): warm neutrals, one clay accent, Geist UI text, serif agent answers, light and dark themes, and the conversation-first layout. UX-4 tokens should follow it, including the AA-corrected colours. It is no longer just a proposal.

Still open for the operator: **R1** (merge strategy) and **U1** (manual-review path for projects without npm checks). Next implementation, once assigned: R4 + R11.

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

## Assessed UI/UX review — 2026-09-28

Claude reviewed the task desk UI: [UX review](reviews/2026-09-28-claude-ux-review.md), [visual prototype](design/task-desk-prototype.html), [handover note](handovers/2026-09-28-claude-ux-review.md). The blockers:

- **U1:** projects without npm checks can never commit. Needs an operator decision.
- **U2:** agent answers are shown as raw Markdown in a terminal box.

The main themes are one primary action per state, removing duplicated panels, and a real design system with a proper phone layout. Codex has recorded [U1–U19 judgments](reviews/2026-09-28-claude-ux-review-response.md) and an [actionable UX backlog](design/ux-backlog.md). No UI change or check waiver was implemented. Suggestion focus already works, output already polls, and sidebar names were present in the inspected browser. Begin core clarity and accessibility foundations after the immediate R4/R11 correction; full UX redesign precedes more feature growth.

## Current state — 2026-09-28

- **Installed release:** v0.19.0, implementation `0af41e2`, confirmed by the operator's successful deployment output; 91 tests passed and both services active.
- **Review branch:** `feat/scoped-agent-settings`, based on `feat/cursor-cli`; [draft PR #19](https://github.com/Futuretunes/agentd/pull/19), stacked on #18. Verify current remote status before acting.
- **Completed:** scoped permissions, visible inheritance, pending approval invalidation, partial-work-preserving restart, model/effort selection and next-run overrides.
- **Still unverified live:** selected-model requests and the remaining provider/GitHub acceptance journeys documented in the detailed note.
- **Next recommendation:** exact-snapshot checks (R4) and mandatory isolation CI (R11), alongside release-baseline decisions; ntfy is deferred. No corrective implementation has been assigned by this handover.
- **Security boundary:** supported installed capabilities only; Codex Chat only; no newly enabled shell, web, MCP, extra host paths or unrestricted network.

This review-response update records findings and bounded diagnostic evidence; it makes no application changes or live model requests.

## History and maintenance

- [2026-09-28 — Exact-tree checks and isolation CI](handovers/2026-09-28-snapshot-checks.md)
- [2026-09-28 — Task desk redesign](handovers/2026-09-28-task-desk-redesign.md)

- [2026-09-28 — Codex follow-up on Claude rejoinders](handovers/2026-09-28-ux-rejoinder-assessment.md)

- [2026-09-28 — Claude rejoinder to UX assessment](handovers/2026-09-28-claude-ux-rejoinder.md)
- [2026-09-28 — UX assessment and backlog](handovers/2026-09-28-ux-backlog.md)
- [2026-09-28 — Claude rejoinder to Codex's response](handovers/2026-09-28-claude-rejoinder.md)
- [2026-09-28 — Codex response to Claude review](handovers/2026-09-28-codex-review-response.md)
- [2026-09-28 — Claude UI/UX review](handovers/2026-09-28-claude-ux-review.md)
- [2026-09-28 — Claude review of v0.19.0](handovers/2026-09-28-claude-review.md)
- [2026-09-28 — Scoped settings and model selection](handovers/2026-09-28-scoped-settings.md)
- [Template for the next work item](handovers/TEMPLATE.md)
- [Remaining backlog](roadmap.md)

Create one dated note per work item, retain earlier notes, and update this entry point. Record implementation commit IDs; the commit containing a handover cannot include its own hash, so use Git history for documentation-only follow-ups. Never put credentials, personal account identities, raw private logs or private infrastructure addresses into these public files.
