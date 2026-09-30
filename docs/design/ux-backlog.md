# Task desk UX backlog

Source: [Claude review](../reviews/2026-09-28-claude-ux-review.md), [Codex assessment](../reviews/2026-09-28-claude-ux-review-response.md), and [visual proposal](task-desk-prototype.html). Status update: core UX-1/2/3/4/5 implemented in candidate 0.20.0; see [implementation handover](../handovers/2026-09-28-task-desk-redesign.md). Actual-phone accessibility acceptance and broader check profiles remain. Engineering stabilization remains the release gate.

## Sequence and ownership

Next corrective implementation remains R4/R11: exact-snapshot checks and mandatory Linux isolation CI. Resolve the release baseline and format the frontend before a broad rewrite. Begin UX-4 foundations with UX-1, then UX-2 and UX-3, then remaining UX-4 phone acceptance and UX-5 polish. Accessibility is continuous, not a final cleanup. Coordinate each bounded work item through the shared handover; do not have two agents rewrite the same frontend simultaneously.

### UX-0 — Make supported validation explicit (U1)

Priority: high. Status: messaging and broader check-profile design queued; manual-review exception awaiting an operator decision.

- Replace the New project promise “Choose Edit files to build it, then review changes before committing” with explicit supported-check prerequisites; this copy correction does not depend on approving a manual-review exception. Explain supported project/check prerequisites before users invest in an edit; remove any implication that all empty or non-npm projects can already complete commit/publish.
- Extend check profiles deliberately for documentation-only and additional language projects, with versioned policy and exact-content evidence.
- Decide separately whether a recorded manual-review path is ever allowed and what it guarantees. Until explicitly approved and designed, retain the existing commit check requirement.
- Acceptance: supported and unsupported projects show truthful next steps; no fabricated passing check or hidden bypass. Link to R4 and broader check profiles in the roadmap.

### UX-1 — Clear answers, next actions and errors (U2, U8, U10, U11, U14, U15)

Priority: high; first UX implementation after corrective prerequisites.

- Keep full raw logs one click away through “View log” and preserve authenticated downloads. Distinguish final answers from raw diagnostics; render a bounded safe Markdown subset with code-copy controls using safe DOM construction. Treat provider output as untrusted. Preserve strict CSP, block executable URLs/HTML and avoid automatic remote image/resource loads.
- Show one primary action for each state, concise approval details and accurate success/needs-review/account/capability language. Preserve all separate approvals and refreshed policy snapshots.
- Replace misleading Dictate behavior with honest keyboard-dictation guidance. Keep suggestion focus and saved drafts; do not auto-submit them.
- Put recoverable errors beside the active control, including within dialogs. Clear obsolete messages and use short-lived success notices only where no action is required.
- Acceptance: Ask, Edit, failed approval and failed modal action journeys are clear on desktop/phone. Malicious Markdown remains inert. Logs stay available. Keyboard focus and approval regression tests pass.

### UX-2 — Predictable navigation and settings (U3, U4, U5, U6, U9)

Priority: high; depends on shared frontend foundations.

- Conversation-first workspace; project menu for project actions; Settings for Agents/accounts, GitHub and defaults; Activity for operational work.
- Combine next-run agent, mode, model and effort choices in the composer, showing effective permissions and override origin in plain language. Keep advanced per-project/conversation/agent inheritance available.
- Give every setting one canonical editing home with contextual links. Preserve account-versus-policy distinctions, pending approval invalidation, active-run immutability and unsupported capability explanations.
- Acceptance: a new user can create/import a project, connect an account, choose a model, run work, find history and restore an archive without hunting through unrelated dialogs. Existing pagination, drafts and audit access survive navigation changes.

### UX-3 — Guided execution and change review (U7, U12, U13)

Priority: high. Dependencies: R4/R11 and R14/R15 for reliable snapshots and bounded binary/large-diff behavior.

- Present elapsed time, bounded current output, cancellation and honest queued/running/awaiting-approval states. Reuse existing polling before adding an event-stream transport. **Candidate 0.84.0:** elapsed time for active runs (`waiting_for_approval` / `queued` / `running` / `cancelling`) now appears beside the conversation status label, derived from task `updated` (status-transition time) with a 1s client tick; no websockets or new backend fields. **Candidate 0.85.0:** while a run is active, the conversation turn shows a bounded plain-text tail of current log output (ANSI stripped, ~6 KB client window on top of the existing 60 KB poll payload); full Activity download remains available. **Candidate 0.86.0:** the composer Send control swaps to ■ Stop (queued/running), Cancel (waiting for approval), or disabled Stopping… (cancelling).
- Preserve creation/approval audit history before a run starts; distinguish it from execution output.
- File-oriented changes panel, phone sheet, readable additions/deletions and clear unsupported/binary/large-file states. Primary progression: review → checks → commit → publication, each retaining required human consent.
- Acceptance: stale checks cannot authorize changed content; partial edits survive revisions/cancellation; failure reasons are visible beside the blocked step. No automatic commit/publish, and logs/history remain accessible.

### UX-4 — Shared visual, mobile and accessibility foundations (U16, U18, U19)

**Operator decision, 2026-09-28:** the operator approved the prototype's visual direction ([task-desk-prototype.html](task-desk-prototype.html)) as the target look. Use its token set (AA-corrected in `review/claude-ux-rejoinder-2026-09-28`) as the starting point. Fonts still have to be vendored locally, and every real text/control pair still needs a contrast check.

Priority: high; start alongside UX-1 and validate in every subsequent item.

- Semantic light/dark tokens for colour, typography, spacing, radii and focus. Verify contrast for actual text/control states; do not copy unverified prototype colours. Use system or locally served fonts and consistent icons without external font/CDN dependencies.
- Phone drawer, compact top bar, keyboard-aware composer, safe-area handling and usable dialogs/sheets. Use generous touch targets and prevent input zoom where appropriate.
- Keyboard-operable attachment control, named controls, visible focus, focus restoration, non-colour status cues and explanations for disabled choices. Respect reduced motion.
- Acceptance: automated accessibility checks plus manual keyboard, screen-reader, zoom/reflow and actual phone keyboard testing. Target WCAG 2.2 AA; record remaining exceptions honestly. Current sidebar names and sampled passing contrast are regression baselines, not confirmed defects.

### UX-5 — Remaining visual consistency (U17)

Priority: normal, after core flows.

- Fix crowded import/label/composer layouts; explain or remove ambiguous badges; make disclosure and icon treatments consistent.
- Logo/font/style preferences require visual review, not a backend change. Do not remove useful native semantics solely to imitate another app.
- Acceptance: coherent desktop and phone screenshots with long titles, empty states, errors and loading states; no clipped controls or inaccessible replacement widgets.

## Definition of done for each chunk

Record implemented versus installed versus live-accepted status; include a Claude-readable handover and relevant tests. Exercise negative/recovery paths with fixtures before operator acceptance. No live consent, model call, publication, policy relaxation or deployment is implied by backlog inclusion. Keep the no-runtime-dependency and strict-CSP constraints unless an independently reviewed change explicitly revisits them.
