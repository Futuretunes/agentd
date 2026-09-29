# 2026-09-28 — Fixes for redesign review D1–D9 (Claude)

- Author/agent: Claude
- Requested outcome: the operator asked Claude to fix every finding from the v0.20.0 redesign review.
- Status: implemented and tested; **not installed**. Installation is the operator's step.
- Release candidate: 0.20.1
- Branch and base: `fix/redesign-review-2026-09-28`, based on `review/claude-redesign-2026-09-28` (which sits on `feat/task-desk-redesign` @ `58d4276`).
- Ownership: Claude held the frontend (`public/`) for this work item. Codex: base further frontend work on this branch to avoid parallel edits.

## Changes and relevant files

- **D1 (`public/ui.js`, `test/ui.test.mjs`):** new patch parser.
  - Header lines are only recognised between `diff --git` and a file's first `@@`. Inside hunks every line is content, so `-- comment` deletions and `++ x` additions are always shown.
  - File names come from the `+++`/`---`/rename headers.
  - Files show New/Deleted/Renamed status and +/− counts; binary files are flagged.
  - "No newline" markers are shown.
  - New `diffStats()`.
  - Two regression tests. They fail on the old parser.
- **D2 (`app.js` `refresh`):** "Conversation/Project not found" for a remembered location now resets to a new conversation (or the first project) and clears the notice, instead of a blank page with a permanent error.
- **D3 (`index.html`, `app.js`):** Settings is one panel with sections: Agents & accounts (rendered inline via `accountsSection()`), GitHub, Defaults, Appearance, and Sign out last.
  - It hands over to the GitHub or defaults editors instead of stacking modals.
  - The separate "Agent capabilities" panel, the Operations-as-accounts mode and the trailing "Advanced defaults" button are gone.
  - Sign-in is hidden for agents that aren't installed. Installed but policy-blocked agents say so, and can still be signed in ahead of time.
  - One usage-limits note replaces the per-agent repeats.
  - Activity (the old Operations view) is now titled "Activity".
- **D4:** the composer has one picker (`#run-picker`) showing agent · model · mode. The popover holds Mode, Agent, reasons for unavailable agents, and "Change model & effort". While a run is queued or running, Send is replaced by Stop, and the card's duplicate "Stop run" is removed.
- **D5:** this note and `docs/handover.md` record that 0.20.0 is installed on the host (since 18:09 UTC, byte-identical to `58d4276`).
- **D6:** run details in plain language: Files, Network, Model (requested), Time limit, Most access allowed. No raw keys, "worktree" or path in the conversation. "Run details" is now "Run history" (base commit and time).
  - Edit results state the review status in words.
  - **Review changes** is the primary button while a review is pending.
- **D7:** the review opens as a right-hand side panel on desktop and a full-screen sheet on phones (diff lines wrap there).
  - A header summary line replaces the `git --stat` block, and git plumbing lines are hidden.
  - Checks come first, with a plain status and the next step.
  - When checks aren't configured, **Set up checks** is primary and Run checks is disabled, with the reason inline (from `/api/check-setup`). Closing setup refreshes the review.
  - The commit message is entered in the panel; the browser `prompt()` is gone.
- **D8:** the page title follows the conversation ("… · agentd"). The empty state no longer repeats the project name, and the idle composer hints are gone. Dialog headings are plain ("New project", "Activity", "Review changes").
- **D9:** the log button reads "Activity" until a run has output, then "View log".
- `package.json`: 0.20.1.

Approval semantics, fingerprints, check requirements (no U1 waiver), CSP and the no-`innerHTML` rule are unchanged. `public/` has 0 HTML sinks.

## Validation evidence

- Typecheck passes.
- `node scripts/test-isolation-ci.mjs` on the Ubuntu host: **101 tests, 101 pass, 0 skipped** (99 before, plus 2 new diff tests).
- Browser check against a throwaway 0.20.1 instance on the host, with a fake Claude CLI and no model calls, at 1440×900 and 375×812:
  - a stale remembered conversation now falls back cleanly;
  - picker popover;
  - plain approval details;
  - Send↔Stop swap;
  - Edit → review side panel showing a deleted `-- drop the audit trigger` line, New tags and counts, with Set up checks as primary and the inline reason;
  - Settings panel;
  - phone review sheet with wrapped lines.
- Not done: real iPhone keyboard or VoiceOver, and live provider runs.

## Deployment and rollback

Not installed. Install the same way as 0.20.0 (the operator's update script with backup, tests under the service boundary, and rollback). This change is frontend-only plus the version number, with no schema change, so rollback to 0.20.0 is file-level.

## Next steps

1. Operator: install 0.20.1 when ready; accept it on the phone.
2. Codex: review this branch with the same verify-don't-accept rule; answer in `docs/reviews/2026-09-28-claude-redesign-fixes-response.md`.
3. Still open for the operator: R1 (merge strategy) and U1 (manual-review path).
