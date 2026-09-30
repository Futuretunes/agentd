# Task desk UX backlog

Source: [Claude review](../reviews/2026-09-28-claude-ux-review.md), [Codex assessment](../reviews/2026-09-28-claude-ux-review-response.md), and [visual proposal](task-desk-prototype.html). Status update: core UX-1/2/3/4/5 implemented in candidate 0.20.0; see [implementation handover](../handovers/2026-09-28-task-desk-redesign.md). Actual-phone accessibility acceptance and broader check profiles remain. Engineering stabilization remains the release gate.

## Sequence and ownership

Next corrective implementation remains R4/R11: exact-snapshot checks and mandatory Linux isolation CI. Resolve the release baseline and format the frontend before a broad rewrite. Begin UX-4 foundations with UX-1, then UX-2 and UX-3, then remaining UX-4 phone acceptance and UX-5 polish. Accessibility is continuous, not a final cleanup. Coordinate each bounded work item through the shared handover; do not have two agents rewrite the same frontend simultaneously.

### UX-0 — Make supported validation explicit (U1)

Priority: high. Status: messaging and broader check-profile design queued; manual-review exception awaiting an operator decision.

- Replace the New project promise “Choose Edit files to build it, then review changes before committing” with explicit supported-check prerequisites; this copy correction does not depend on approving a manual-review exception. Explain supported project/check prerequisites before users invest in an edit; remove any implication that all empty or non-npm projects can already complete commit/publish. **Done in product copy:** New project already states empty repos can ask/plan, and edits commit only after supported npm checks pass.
- Extend check profiles deliberately for documentation-only and additional language projects, with versioned policy and exact-content evidence.
- Decide separately whether a recorded manual-review path is ever allowed and what it guarantees. Until explicitly approved and designed, retain the existing commit check requirement.
- Acceptance: supported and unsupported projects show truthful next steps; no fabricated passing check or hidden bypass. Link to R4 and broader check profiles in the roadmap.

### UX-1 — Clear answers, next actions and errors (U2, U8, U10, U11, U14, U15)

Priority: high; first UX implementation after corrective prerequisites.

- Keep full raw logs one click away through “View log” and preserve authenticated downloads. Distinguish final answers from raw diagnostics; render a bounded safe Markdown subset with code-copy controls using safe DOM construction. **Candidate 0.118.0:** Copy announces success via `aria-live` and resets after 2s. Treat provider output as untrusted. Preserve strict CSP, block executable URLs/HTML and avoid automatic remote image/resource loads.
- Show one primary action for each state, concise approval details and accurate success/needs-review/account/capability language. Preserve all separate approvals and refreshed policy snapshots. **Candidate 0.89.0:** waiting-for-approval turns lead with one sentence (what the agent will do / whether files change / time limit), a model·effort line, and Details collapsed behind disclosure. **Candidate 0.92.0:** finished Ask/chat turns say “Answer ready”; pending edits stay “Changes ready for review”; committed edits say “Committed”. **Candidate 0.93.0:** Operations summary adds “Awaiting review” and excludes pending-review succeeds from “Completed”. **Candidate 0.94.0:** Operations uses “Sign in for later” for policy-disabled adapters; Cursor capability notes only when Cursor is available. **Candidate 0.111.0:** without a project, New conversation and Send explain they need a project first.
- Replace misleading Dictate behavior with honest keyboard-dictation guidance. Keep suggestion focus and saved drafts; do not auto-submit them. **Candidate 0.90.0:** suggestion chips fill the composer, park the caret at the end, focus the field, and show a short draft hint — they do not auto-send. **Candidate 0.122.0:** suggestion chips are a named group with `Use suggestion:` accessible names. **Candidate 0.123.0:** Escape closes agent picker and conversation menu outside dialogs. **Candidate 0.125.0:** those menus sync `aria-expanded` on their summaries.
- Put recoverable errors beside the active control, including within dialogs. Clear obsolete messages and use short-lived success notices only where no action is required. **Candidate 0.88.0:** page/dialog notices auto-dismiss (5s info / 8s error) and the page toast sits above open dialogs. **Candidate 0.110.0:** notices set `role="alert"` for errors and `role="status"` for info.
- Acceptance: Ask, Edit, failed approval and failed modal action journeys are clear on desktop/phone. Malicious Markdown remains inert. Logs stay available. Keyboard focus and approval regression tests pass.

### UX-2 — Predictable navigation and settings (U3, U4, U5, U6, U9)

Priority: high; depends on shared frontend foundations.

- Conversation-first workspace; project menu for project actions; Settings for Agents/accounts, GitHub and defaults; Activity for operational work. **Candidate 0.106.0:** user-facing errors and guidance say Activity (matching the nav label), not Operations.
- Combine next-run agent, mode, model and effort choices in the composer, showing effective permissions and override origin in plain language. Keep advanced per-project/conversation/agent inheritance available.
- Give every setting one canonical editing home with contextual links. Preserve account-versus-policy distinctions, pending approval invalidation, active-run immutability and unsupported capability explanations.
- Acceptance: a new user can create/import a project, connect an account, choose a model, run work, find history and restore an archive without hunting through unrelated dialogs. **Candidate 0.119.0:** Search & history and New project autofocus their primary fields. **Candidate 0.120.0:** history results announce searching via `aria-busy`/`aria-live`; login form is described; project name autofocuses. Existing pagination, drafts and audit access survive navigation changes.

### UX-3 — Guided execution and change review (U7, U12, U13)

Priority: high. Dependencies: R4/R11 and R14/R15 for reliable snapshots and bounded binary/large-diff behavior.

- Present elapsed time, bounded current output, cancellation and honest queued/running/awaiting-approval states. Reuse existing polling before adding an event-stream transport. **Candidate 0.124.0:** conversation region sets `aria-busy` while refreshing. **Candidate 0.84.0:** elapsed time for active runs (`waiting_for_approval` / `queued` / `running` / `cancelling`) now appears beside the conversation status label, derived from task `updated` (status-transition time) with a 1s client tick; no websockets or new backend fields. **Candidate 0.85.0:** while a run is active, the conversation turn shows a bounded plain-text tail of current log output (ANSI stripped, ~6 KB client window on top of the existing 60 KB poll payload); full Activity download remains available. **Candidate 0.86.0:** the composer Send control swaps to ■ Stop (queued/running), Cancel (waiting for approval), or disabled Stopping… (cancelling). **Candidate 0.87.0:** pending review footer shows one primary step (Set up checks / Run checks / Commit) with sticky next-step guidance; Request revisions and Discard stay secondary. **Candidate 0.91.0:** after commit, sticky footer promotes Publish to GitHub (or Recheck when snapshot checks are stale); feedback stays secondary.
- Preserve creation/approval audit history before a run starts; distinguish it from execution output.
- File-oriented changes panel, phone sheet, readable additions/deletions and clear unsupported/binary/large-file states. Primary progression: review → checks → commit → publication, each retaining required human consent.
- Acceptance: stale checks cannot authorize changed content; partial edits survive revisions/cancellation; failure reasons are visible beside the blocked step. No automatic commit/publish, and logs/history remain accessible.

### UX-4 — Shared visual, mobile and accessibility foundations (U16, U18, U19)

**Operator decision, 2026-09-28:** the operator approved the prototype's visual direction ([task-desk-prototype.html](task-desk-prototype.html)) as the target look. Use its token set (AA-corrected in `review/claude-ux-rejoinder-2026-09-28`) as the starting point. Fonts still have to be vendored locally, and every real text/control pair still needs a contrast check.

Priority: high; start alongside UX-1 and validate in every subsequent item.

- Semantic light/dark tokens for colour, typography, spacing, radii and focus. Verify contrast for actual text/control states; do not copy unverified prototype colours. Use system or locally served fonts and consistent icons without external font/CDN dependencies.
- Phone drawer, compact top bar, keyboard-aware composer, safe-area handling and usable dialogs/sheets. **Candidate 0.117.0:** phone drawer slides and dialogs sheet-up (reduced-motion respected); drawer respects safe-area-top. **Candidate 0.121.0:** review sticky footer clears safe-area-bottom. Use generous touch targets and prevent input zoom where appropriate. **Candidate 0.99.0:** phone primary controls ≥ 44px; prompt 16px; turn/status copy 15px. **Candidate 0.100.0:** disabled agent/mode options expose title reasons. **Candidate 0.101.0:** phone Send stays on the tools row. **Candidate 0.102.0:** status/outcome styles add weight (and failure underline) so they are not colour-only. **Candidate 0.103.0:** dialog × closes share a 44×44 hit target. **Candidate 0.104.0:** selected sidebar rows add weight + inset accent bar and `aria-current="page"`.
- Keyboard-operable attachment control, named controls, visible focus, focus restoration, non-colour status cues and explanations for disabled choices. Respect reduced motion. **Candidate 0.96.0:** project and conversation sidebar buttons set accessible names. **Candidate 0.104.0:** selected project/conversation buttons set `aria-current="page"`. **Candidate 0.105.0:** modals restore focus to the opener through `openDialog`. **Candidate 0.107.0:** signed-in workspace offers a skip link into the conversation region. **Candidate 0.109.0:** draft/policy/composer hints use `aria-live="polite"`. **Candidate 0.112.0:** connection ● is decorative; login autofocuses the access key. **Candidate 0.113.0:** New conversation controls set a stable `aria-label`. **Candidate 0.114.0:** Send and Stop/Cancel expose glyph-free accessible names. **Candidate 0.115.0:** every workspace dialog sets `aria-labelledby` to its heading. **Candidate 0.116.0:** Attach is a keyboard-focusable button that opens the image picker. **Candidate 0.126.0:** attached image chips expose `Remove attachment:` names. **Candidate 0.127.0:** compose form is named and described by hint regions. **Candidate 0.118.0:** answer code Copy announces politely and phone Copy targets stay ≥44px; theme-color follows appearance.
- Acceptance: automated accessibility checks plus manual keyboard, screen-reader, zoom/reflow and actual phone keyboard testing. Target WCAG 2.2 AA; record remaining exceptions honestly. Current sidebar names and sampled passing contrast are regression baselines, not confirmed defects.

### UX-5 — Remaining visual consistency (U17)

Priority: normal, after core flows.

- Fix crowded import/label/composer layouts; explain or remove ambiguous badges; make disclosure and icon treatments consistent. **Candidate 0.95.0:** New project name/create precede Import; composer top fade softens scroll under the sticky compose area. **Candidate 0.96.0:** Project badges say “N conversation(s)” and sidebar rows expose aria-labels. **Candidate 0.97.0:** approval/file-review disclosures use consistent CSS chevrons. **Candidate 0.98.0:** brand surfaces use an SVG diamond mark instead of the text ◈ glyph. **Candidate 0.108.0:** empty conversation lists offer a New conversation control; truncated project/thread headings keep a title tooltip.
- Logo/font/style preferences require visual review, not a backend change. Do not remove useful native semantics solely to imitate another app.
- Acceptance: coherent desktop and phone screenshots with long titles, empty states, errors and loading states; no clipped controls or inaccessible replacement widgets.

## Definition of done for each chunk

Record implemented versus installed versus live-accepted status; include a Claude-readable handover and relevant tests. Exercise negative/recovery paths with fixtures before operator acceptance. No live consent, model call, publication, policy relaxation or deployment is implied by backlog inclusion. Keep the no-runtime-dependency and strict-CSP constraints unless an independently reviewed change explicitly revisits them.
