# 2026-09-28 — Task desk redesign

- Author: Codex.
- Request: operator explicitly moved UI/UX ahead of the stabilization order, then requested continuing the backlog.
- Status: implemented locally; not installed or live-provider accepted.
- Installation update (Claude, 2026-09-28): the host runs 0.20.0, byte-identical to `58d4276`, since 18:09 UTC (operator-run installer). Not yet live-provider accepted.
- Release candidate: 0.20.0; installed release remains 0.19.0.
- Branch/base: `feat/task-desk-redesign` from consolidated documentation `fe73e18`; standalone formatting commit `b8d670a` precedes behavior changes.

## Changes

Conversation-first layout, phone navigation drawer, compact actions menu, Settings/account entry points, appearance selection, locally bundled OFL Geist fonts, serif answers, composer model/effort access and effective next-run selection. File-oriented diff review, clearer next step, modal-local errors, keyboard-accessible attachments, elapsed run state and composer Stop. Removed misleading Dictate button; keyboard dictation remains available. Existing run/check/commit/publication approvals and isolation policies are preserved.

`public/ui.js` renders bounded Markdown using safe DOM nodes (no HTML or remote links/images), reviews per-file diffs and provides responsive shell behavior. `src/runner.ts` captures bounded stdout separately from combined diagnostics for new runs; old runs retain View log. The gateway serves an explicit static allowlist including bundled fonts. `linkedom` is development-only for renderer tests; no new runtime dependency.

## Evidence

TypeScript check passed. macOS suite: 95 tests, 88 passed, 7 Linux-only skips, zero failures. Renderer tests cover hostile markup, bounds and diff text; runner regression verifies stdout/stderr separation; gateway tests cover static asset delivery. Browser fixture verified approval-gated fake execution, rendered answers, model/effort overrides, account navigation, light theme, narrow-screen drawer, file review and blocked-check error inside the active sheet. No provider requests or account consent. Linux verification follows with the next correctness work item.

## Limits and deployment

No deployment or service change yet. Actual iPhone keyboard/VoiceOver and complete WCAG audit remain outstanding. Source Serif is represented by a local system serif fallback; Geist is bundled locally. Markdown supports a deliberately small subset, leaving links/images literal. Historical combined logs cannot be reliably reconstructed into final answers. Existing binary/large-diff backend limitations and check policy remain pending. No manual-review check waiver.

## Next

Continue R4/R11 now as requested: execute checks from approved Git trees, then mandatory non-skipping Linux isolation CI. Prepare one reviewed candidate after both work items; retain separate commits and handovers. R1 merge strategy remains undecided, so no automatic main merge or PR closures.
