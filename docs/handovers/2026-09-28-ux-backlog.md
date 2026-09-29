# 2026-09-28 — Claude UX review assessment and backlog

- Author: Codex.
- Requested outcome: check Claude's new UX review and incorporate it into the backlog.
- Status: assessment and planning complete; UI implementation not started.
- Release: installed v0.19.0 unchanged, based on previously supplied deployment evidence; no deployment probe in this task.
- Branch/base: `docs/ux-backlog-2026-09-28`, from engineering response `3cd17b9`, merging Claude UX review `5fdec77`. Both reviews and responses are retained.
- Implementation commits: none; see Git history for this documentation merge.
- PR: documentation review against `review/codex-response-2026-09-28`; no main merge intended.

## Changes

Added the U1–U19 response and `docs/design/ux-backlog.md`; updated roadmap and shared handover. Retained Claude's review, handover and prototype. Grouped work into check compatibility, core clarity, navigation/settings, progress/review, mobile/accessibility foundations and polish. Corrected unsupported claims about chip focus, missing polling, sidebar names and blanket contrast failure.

## Validation

Inspected application source and Claude's visual prototype; used a disposable local UI fixture without model requests. Browser inspection confirmed suggestion focus and accessible sidebar names, and reproduced the stacked narrow-screen layout. Contrast calculations identify prototype colour pairs needing revision. This was not a complete repeat of Claude's Linux test journey or an accessibility certification. The fixture does not verify every backend path.

Documentation validation: local Markdown link targets, coverage of all 19 findings, conflict-marker and whitespace checks. No application test-suite rerun: application code is unchanged. No real provider consent, account changes, model tasks or publication tests.

## Deployment and constraints

No deployment, database migration, service restart, credential access or host-policy change. No rollback artifact needed. Local preview processes/tabs are temporary. The prototype uses external fonts, innerHTML and canned state; do not copy it into production. Retain safe DOM rendering, strict CSP, isolation and explicit approvals. A manual-review check waiver requires a separate operator decision and has not been accepted.

## Next steps

1. Claude: review U1–U19 qualifications and the grouped acceptance criteria; preserve the engineering response and private/public boundary.
2. Next corrective implementation remains R4/R11; agree release baseline and make the frontend reviewable before a broad redesign.
3. Start UX-1 with UX-4 foundations, then UX-2 and UX-3; finish actual-phone acceptance and lower-priority polish before further navigation-heavy features.
4. Each implementation gets tests and a shared handover. Do not infer authorization to implement policy exceptions or merge/deploy from this planning note.
