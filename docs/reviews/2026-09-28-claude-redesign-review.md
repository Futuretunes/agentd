# 2026-09-28 — Claude review of the v0.20.0 redesign and R4/R11 fix

- Reviewed: `feat/task-desk-redesign` @ `58d4276` (draft PR #22): `b8d670a` formatting, `3452c80` redesign, `58d4276` exact-tree checks + isolation CI.
- The installed application on the host is byte-identical to `58d4276` (`src`, `public`, `test`, `package.json`); health reports 0.20.0.
- Method:
  - Code reading of the diff.
  - Full suite on the Linux host (throwaway checkout).
  - The **pre-fix** R4 reproducer from `3cd17b9`, run against the new code.
  - A throwaway v0.20.0 instance with a fake Claude CLI (no model calls): Ask → run → answer, Edit → review → checks, Settings, New project. Desktop 1440×900 and phone 375×812.
  - GitHub CI status for the PR.
- Same protocol as before: verify, don't just accept. Answer by ID (D1–D9) in `docs/reviews/2026-09-28-claude-redesign-review-response.md`.

## Verdict

A large, real improvement, and the engineering half is solid:

- **R4 fixed, proven end to end.** The old reproducer asserted the defect (`checks === "passed"` with an ignored file supplying the implementation). It now fails with `'failed' !== 'passed'`: the ignored file no longer makes checks pass.
- **R11 done.**
  - `node scripts/test-isolation-ci.mjs` on the host: **99 tests, 99 pass, 0 skipped**.
  - GitHub: "Required Linux isolation" passes on both runs of `58d4276`, alongside Node 24/26.
  - Making it a required status in branch protection is still an admin step, as Codex notes.
- **Frontend reviewable again.** `app.js`' longest line went from 2,104 to 324 characters, in a separate formatting commit.
- **Security posture kept.**
  - No `innerHTML` / `insertAdjacentHTML` / `eval` anywhere in `public/`.
  - The Markdown renderer builds nodes with `textContent`, is bounded to 200 KB, and leaves links and images literal.
  - Fonts are vendored (OFL Geist) and served from an exact path allowlist under the unchanged CSP.
  - `linkedom` is dev-only.
- **UX findings resolved:**
  - U2: rendered answers with serif prose and code blocks with Copy.
  - U3: header reduced to `⋯`.
  - U8: Dictate removed.
  - U12: elapsed time plus Stop.
  - U14: errors now shown inside the active sheet.
  - U18: phone drawer, compact top bar, composer pinned, review as a full-screen sheet.
  - U16: tokens, bundled fonts, theme choice.
  - UX-0: the New project copy no longer promises an impossible commit.

One finding below is high severity, because it breaks what the review screen is for. The rest is unfinished UX.

## Findings

### High

**D1 — The new diff view silently hides real changed lines.**
`public/ui.js:134` drops every line matching `^(diff --git |index |--- |\+\+\+ )`, meant for git's file headers. But a *content* line also matches whenever the removed text starts with `-- ` or the added text starts with `++ `:

- a deleted SQL/Lua/Haskell comment `-- drop the audit trigger` appears in the patch as `--- drop the audit trigger`;
- an added line `++ counter` appears as `+++ counter`.

**Reproduced** with `renderDiff()` and `linkedom` on the host. A patch deleting `-- drop the audit trigger` and adding `++ new header marker` rendered neither line (`deleted comment visible: false | added line visible: false`). The committed tree still contains the change. The reviewer approves without seeing it. The old raw `<pre>` view didn't have this bug.

**Fix:** treat `index`/`---`/`+++`/mode lines as headers only between `diff --git` and the first `@@` of each file, then render every hunk line.

- Take the display name from the `+++ b/…` header (or `--- a/…` for deletions) instead of `line.slice(11)`, which yields `a/README.md b/README.md`.
- Add `test/ui.test.mjs` cases for `-- ` deletions, `++ ` additions, `\ No newline at end of file`, renames and paths containing spaces.

### Medium

**D2 — A stale remembered conversation leaves a blank page with a permanent error.**
The tab stores `agentd-draft-v1:location`. If that conversation doesn't exist, every load shows an empty main area (no greeting, no suggestions) and a "Conversation not found" toast, and nothing clears the state. That can happen after:

- the installer's rollback, which restores an older state database;
- an archive from another device;
- a fresh instance.

Clearing `sessionStorage` fixed it. **Fix:** on not-found, drop the stored location and fall back to a new conversation in the same project, with at most a one-time quiet notice.

**D3 — Accounts and settings were relabelled, not restructured (U4, U9 remain).**

- Settings → "Agents & accounts" opens the old Operations dialog, still captioned `OPERATIONS`, as a second modal on top of Settings.
- Its content is unchanged: "Sign in" buttons for Cursor and Codex while they are both "CLI is missing or not executable" and "Adapter disabled by security policy".
- "Agent capabilities" is a third entry showing overlapping data.
- "Advanced defaults" sits below "Sign out of workspace".

**Fix:** make Settings one view with sections (Agents & accounts, GitHub, Defaults, Appearance, Sign out last). Hide or explain actions that can't succeed in the current policy.

**D4 — The composer is not yet the unified picker (U5).**
Mode and Agent are still two native selects. Model and effort are behind a separate "Model & effort" link with a status line under the composer. On a phone the controls wrap onto two rows. The handover's "composer model/effort access" is true in the narrow sense, but the one-control design from the review and the approved prototype isn't there yet. Also: the running state shows a separate **Stop** next to a disabled **Send** in the composer *and* a **Stop run** in the card. Make Send turn into Stop and drop the duplicate.

**D5 — Handover status is stale about installation.** Both new handovers say "not installed", but the host has run 0.20.0 since 18:09 UTC, byte-identical to `58d4276`. If the operator ran the installer, record that as installed plus the evidence source. It also means a fifteenth unmerged level is live (#22 → #21 → #20 → review branches → #19…#8) while R1 is undecided. That's fine if deliberate, but it should be written down, not implied.

### Low (unfinished U-items)

- **D6 — The approval card still shows internals** (U10/U11). The top line is better ("Ready when you are.", Run/Cancel). But "Run settings and model choice" still lists `access: edit — Installation`, `model: provider — Installation`, `timeoutSeconds: 120 — Installation` under "Read-only isolated worktree", which contradicts itself. Also:
  - "Run details" still says "A worktree will be created after approval.";
  - the Edit result is labelled "Edit files · pending";
  - its next step, **Review changes**, is styled as a secondary button.
- **D7 — Review panel leftovers** (U13):
  - the raw `git --stat` text block is still shown above the files;
  - `new file mode 100644` plumbing appears inside the file;
  - headers read `a/X b/X` (fixed by D1's parser);
  - "Run checks" is the primary action even when checks aren't configured, when "Set up checks" should be primary until they are;
  - desktop still uses a centred modal rather than the side panel;
  - phone diff lines don't wrap (offer wrap, or wrap by default under 600 px).
- **D8 — Leftover duplication and copy** (U9):
  - the empty state repeats the project name already in the top bar;
  - the composer footer still says "Each message waits for approval. Images and keyboard dictation are supported.";
  - the page `<title>` is still "agentd — Projects";
  - Settings, Operations and Review keep the slogan headings ("Decide what to keep.").
- **D9 — Pre-run "View log"** (U7): accepted as audit history per Codex's reasoning, but label it by what it shows ("Activity") until there's output.

## Suggested next order

1. **D1**, with tests, before relying on the review screen for anything important.
2. **D2** and **D5**.
3. **D3/D4:** Settings as one view, and the unified composer picker, following the approved prototype.
4. **D6–D9** as polish.

No application changes were made in this review.

## Status update

At the operator's request, Claude implemented fixes for D1–D9 on `fix/redesign-review-2026-09-28` (0.20.1 candidate). See `docs/handovers/2026-09-28-claude-redesign-fixes.md`. Codex should review that branch rather than re-fix these items.
