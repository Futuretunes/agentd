# 2026-09-28 — Claude UI/UX review of the agentd task desk (v0.19.0)

- Reviewer: Claude (Claude Code), at the operator's request.
- Operator's brief: *"I don't like the UI. Some things are in non-logical spots, some stuff is in there double. It should feel as if Anthropic or OpenAI designed it: very user friendly and very good looking."*
- Scope: `public/index.html`, `public/app.js`, `public/style.css` @ `feat/scoped-agent-settings` (`cb3a9cf`), which is identical to the installed UI.
- Method: the real v0.19.0 runner and gateway, with a fake CLI that never contacts a model, strict workers on, Claude enabled for Ask and Edit. It ran in a throwaway directory on the Linux host, reached over an SSH tunnel.
  - I went through every screen at 1440×900 and at 375×812: login, empty state, send → approve → run → result, Edit run → review → checks, and each of Operations, Agents, Project details, Agent settings, History and New project.
  - Quotes below are the UI's literal text.
- Companion: [engineering review](2026-09-28-claude-review.md). Same protocol: **verify, don't just accept.** Answer by ID in `docs/reviews/2026-09-28-claude-ux-review-response.md`. Push back where you think a finding is wrong or conflicts with a security invariant. Security rules win over polish, but most of this is presentation.

## Verdict

Real care went into the product, and it shows. Approval gating, preserved drafts, honest wording about what agentd can't verify, and `textContent`-only rendering are all good. **But the UI exposes the system's internal structure instead of the user's task.** Every subsystem Codex built (operations, adapters, settings scopes, check setup, publishing, GitHub connection, history) got its own button, dialog or panel and its own explanatory paragraph. The result:

1. **No single primary action per state.** The user has to work out what to do next from 7 header buttons, 3–5 card buttons and several disclosures.
2. **The same information appears in 2–5 places**, often with slightly different wording that contradicts itself.
3. **Engineering vocabulary everywhere:**
   - `access: edit — Installation`, `timeoutSeconds: 120`
   - "worktree", "Revision 61923aa91353"
   - `diff --git … index aec8976..b64325f 100644`
   - "Installation ceiling", "Inherit removes this field's override"
4. **No design system.** There are 3 CSS variables, but 30 hard-coded colours, 17 different font sizes (10–44 px, 22 uses of ≤ 12 px), 6 border radii, and no light theme.
5. **Mobile is a stacked desktop page, not a phone app.** This is the product's primary surface ("mobile task desk").

What "designed by Anthropic/OpenAI" means in practice (claude.ai, ChatGPT, Codex web):

- The conversation is the product and everything else stays out of its way.
- Exactly one obvious next step.
- Plain language.
- Details one click away, never on the surface.
- A small, strict set of type sizes, colours and radii.
- Calm motion and immediate feedback.

The findings below are measured against that.

## Findings

Severity is UX severity. **Blocker** means a user cannot complete a core journey.

### Blockers

**U1 — Committing is impossible in any project without npm tests. That includes every project created with "New project".**
"New project" creates an empty repository (the dialog says so). After an Edit run:

1. Review → **Run checks** → toast: "Open Set up checks to prepare this project's dependencies."
2. **Set up checks** → a second modal on top of the first: "Add package.json, package-lock.json and a test script to configure npm checks."
3. **Approve commit** stays disabled.

There's no way forward for docs-only, Python, Go, Swift or brand-new projects. The only route is to ask the agent to invent an npm test harness. The recommended journey (create → edit → review → commit) dead-ends.

**Fix:** make checks optional per project, with an explicit, recorded choice: "This project has no automated checks. Commit after reviewing the diff yourself." Keep the existing checks-must-pass rule when checks exist. This touches a security/process invariant (R4 in the engineering review), so it is the operator's decision. Codex: raise it; don't decide it silently.

**U2 — The agent's answer is rendered as raw Markdown in a monospace terminal box.**
`## Structure`, `- README.md …` and `1. …` show up literally, in a code font, inside a dark panel. This is the core reading surface. Every model answer should read like claude.ai/ChatGPT: proportional type, rendered headings, lists, inline code and code blocks.

**Fix:** a small, safe Markdown renderer that builds DOM nodes, never `innerHTML`. That preserves the current XSS posture. Supported syntax: headings, paragraphs, lists, emphasis, inline code and fenced code (with a copy button). Keep raw logs for "View log".

### Information architecture: things in illogical places

**U3 — One flat header row mixes four scopes.**
`Rename · Archive · History · Operations · Agents · Project details · Agent settings`: 7 equal-weight text buttons.

| Scope | Buttons |
|---|---|
| Conversation | Rename, Archive |
| Global | History, Operations |
| Agent | Agents, Agent settings |
| Project | Project details |

On a phone they wrap onto two rows above the conversation. Nothing indicates which object a button acts on: "Rename" (conversation) vs "Rename project" (inside Project details).

**Fix:** see the proposed structure below. Conversation actions go in a `⋯` menu next to the title. Project actions go in the project's `⋯` menu in the sidebar. Global items go in the sidebar footer (avatar/workspace menu).

**U4 — Account sign-in/sign-out lives in "Operations", a monitoring dashboard.**
Meanwhile "Agents" says "Sign-in is checked when a run starts". Connecting accounts is setup, not monitoring. It belongs in **Settings → Agents & accounts**, together with GitHub (which is currently reachable only via New project → Import from GitHub → GitHub connection, three dialogs deep).

**U5 — Choosing *how* an agent runs is split between the composer and a separate dialog.**
The composer has Mode and Agent selects. Model, effort, access and time limit are in "Agent settings", which has 5 scopes (Project defaults / This agent in this project / Conversation defaults / This agent in this conversation / Next run only). "Next run only" is really a composer option, and the other four are advanced defaults.

**Fix:**

- The composer gets one control, e.g. `Claude · Sonnet · Edit ▾`, with model and effort inside it (like ChatGPT's model picker).
- "Next run only" becomes that picker's state.
- Defaults move to **Project settings** (project scope) and to the conversation `⋯` menu ("Settings for this conversation…").
- Drop the separate "agent within scope" layers from the main UI, or move them under "Advanced".

**U6 — Project management is scattered.**
Create is in the sidebar `＋`. Import from GitHub is a button *inside* the Create dialog. Details, check setup, rename and archive are behind a header toggle that pushes an inline panel over the conversation. Restoring an archived project happens in the History dialog.

**Fix:** a project `⋯` menu (Settings, Rename, Archive) and a Project settings page (Checks, Defaults, GitHub). "New project" offers two equal choices: **Empty project** or **Import from GitHub**. Archived items get an "Archived" filter in the sidebar/history.

**U7 — "Run activity" appears before anything has run** (on the approval card), and the "Run details" disclosure says "A worktree will be created after approval." Show run history only once a run exists.

**U8 — The Dictate button doesn't dictate.** Its handler only focuses the textarea (`$('prompt').focus()`), and the README confirms recording isn't implemented. A control that doesn't do what it says costs trust. Remove it. The phone keyboard's mic already works in any textarea.

### Duplication

**U9 — The same fact appears in multiple places.** Consolidate each into one home:

| Information | Where it appears today | One home |
|---|---|---|
| "You approve every run" reassurance | Login tagline; empty state ("You decide when it runs."); composer hint ("Each message waits for approval…"); policy hint ("Isolated workers · provider-only network access · approval required."); sidebar footer ("You approve runs and commits") | Once, in the empty state. After that the approval card itself teaches it |
| Agent availability | "Agents" inline panel; Operations → "Agents and usage"; disabled options in the Agent select; policy hint | Composer picker (unavailable agents greyed, with a reason on hover/tap) + Settings → Agents & accounts |
| Run settings | Inline "Run settings and model choice" disclosure; again in Run activity; again as "Current effective settings" in Agent settings | One "Details" disclosure on the run card |
| Agent output | Inline message; again in the Run activity modal ("Latest output") | Inline only. Run activity = timeline + "Download log" |
| Set up checks | Review modal; Project details panel | Project settings → Checks (the review links to it) |
| Status label ("Finished · review result") | Sidebar item, message header, Run activity, Operations twice | Message header + a small status dot in the sidebar |
| Project name | Header eyebrow; empty-state eyebrow; selected sidebar item | Sidebar selection + breadcrumb only |
| Conversations list | Sidebar; History dialog | Sidebar with a search field on top. History as a separate dialog goes away |

**U10 — The copy contradicts itself.**

- The approval card says "Read-only isolated worktree" and, lines below, "access: edit — Installation".
- The Ask run shows "Finished · review result", but Ask produces nothing to review.
- Operations counts the pending-review edit as "Completed: 2 / Need attention: 0", while listing it under "Current work … Changes are waiting for review".
- Operations shows "Sign in" for Cursor and Codex, which are "Adapter disabled by security policy".
- The Agents panel ends with a Cursor note ("Cursor supports text and file changes…") while Cursor is unavailable.

### Core flows

**U11 — The approval card is buried in text.**
The primary action (`Approve & run`) sits among `Reject` and `Run activity`, below two disclosures. On approval, what the user needs is one sentence: "Claude will read your project and answer. Runs up to 2 min. Nothing is changed." That sentence plus **Run** / **Cancel** is enough. Model and effort go on one line; everything else goes behind "Details".

**U12 — There's no sense of progress while running.** "Working" plus "Your agent's output will appear here." Add:

- a subtle animated indicator with elapsed time ("Working · 0:12");
- streaming output if the log is available, or at least a periodic tail.

The Stop button should be the composer's send button turning into ■, as in ChatGPT and claude.ai.

**U13 — The change review is a raw `git diff` dump in a modal.**
It shows `diff --git`, `index … 100644`, `--- a/…`, `+++ b/…`, the `git --stat` text block, and five equal buttons: `Request revisions · Set up checks · Run checks · Approve commit (disabled) · Discard review`.

**Fix:** a full-height side panel (desktop) or full-screen sheet (phone) containing:

- a file list with +/− counts;
- per-file collapsible diffs with line numbers and red/green backgrounds, git plumbing lines hidden;
- a sticky footer with **one** primary action for the current step. It progresses: `Run checks` → (passing) `Commit…` (opens the message field) → after commit `Publish to GitHub…`.
- "Request changes" and "Discard" as secondary actions.

State why a step is disabled inline, never only in a toast.

**U14 — Errors show up as a toast behind the modal backdrop, and toasts linger.**
The "Open Set up checks…" toast rendered under the review dialog's backdrop and was still visible minutes later, on other screens. Errors belong inline, next to the control that caused them. Toasts should auto-dismiss (4–6 s), sit above dialogs, and be reserved for confirmations.

**U15 — Suggestion chips give no feedback.** Clicking "Explain this project" silently fills the textarea. Either send immediately (the approval step is the safety net) or visibly fill and focus with the cursor at the end.

### Visual design

**U16 — There is no design system.**

- 3 custom properties vs 30 hard-coded hex colours.
- 17 font sizes (10–44 px, 22 uses at ≤ 12 px: too small on phones).
- 6 radii.
- Buttons in at least 4 visual styles.
- Headings alternate between marketing voice ("Give your work a home.", "Decide what to keep.", "Your workspace at a glance.") and plain labels ("Set up checks", "GitHub repositories").
- Close controls vary (`×` in a tall box vs a text "Close" button).
- Dark-only: `color-scheme:dark` and no `prefers-color-scheme`.

**Fix:** use the token set in the spec below. Every colour, size, radius and shadow comes from tokens, and CI greps `style.css` for raw hex outside `:root`. Pick one voice for UI copy: plain, sentence case, no slogans inside dialogs.

**U17 — Layout details:**

- New project dialog: the "Import from GitHub" button sits inline next to the "Project name" label (broken flow).
- Content scrolls underneath the composer with no fade.
- The textarea shows a native resize handle.
- The approval card's disclosures use browser-default `▸` triangles.
- The "0"/"1" badge on the project item is unexplained.
- The logo glyph "◈" is a text character, not an SVG mark.

### Mobile (primary surface)

**U18 — The phone layout is the desktop page stacked vertically.** At 375 px:

- the full sidebar (projects + conversations) comes first;
- then the 7 header buttons on two rows;
- the conversation starts about 600 px down;
- the composer is `position: static`, so you must scroll to the very bottom to reply;
- "Send" wraps to its own row.

**Fix:**

- A top bar (`☰` · title · `⋯`).
- The sidebar as a slide-over drawer.
- A sticky composer that respects `env(safe-area-inset-bottom)` and the on-screen keyboard.
- Dialogs as bottom sheets.
- Tap targets ≥ 44 px.
- Body text ≥ 15–16 px (16 px in inputs to avoid iOS zoom).

### Accessibility

**U19 — Several accessibility gaps:**

- Sidebar project/conversation items expose no accessible name in the accessibility tree (tested with `read_page`: `button [ref] type="button"` with no name).
- The attach control is a `<label>` for a hidden input, so it can't be reached by keyboard.
- Status is colour-only in places.
- 10–11 px muted grey on near-black likely fails WCAG AA contrast.
- Disabled `<option>`s give no reason.
- Dialogs don't restore focus to their trigger in every path.

Target WCAG 2.2 AA, and add an axe check to the Playwright/fixture run.

## Proposed structure

```
┌ Sidebar ─────────────────┐┌ Conversation ──────────────────────────────────┐
│ ◆ agentd            ⌘K   ││ Project / Conversation title          ⋯        │
│ [+ New chat]             ││                                                │
│ 🔍 Search                ││   You: Add a greeting helper…                  │
│                          ││                                                │
│ PROJECTS                 ││   ✳ Claude · Sonnet · Edit     ● Needs review  │
│ ▾ Demo project      ⋯    ││   I added a small greeting helper…  (rendered) │
│    Explain this project ●││   ┌ 2 files changed  +7 −0   [Review changes] ┐ │
│    Greeting helper       ││   └──────────────────────────────────────────┘ │
│ ▸ agentd            ⋯    ││                                                │
│                          ││ ┌────────────────────────────────────────────┐ │
│                          ││ │ Message Claude…                            │ │
│ ─────────────────────── ││ │ ＋   Claude · Sonnet · Edit ▾          [↑] │ │
│ ⚙ Settings  ◷ Activity   ││ └────────────────────────────────────────────┘ │
└──────────────────────────┘└────────────────────────────────────────────────┘
```

- **Sidebar:** new chat, search (replaces the History dialog), projects as collapsible groups with their conversations nested (replaces the separate Projects/Conversations lists), and a footer with **Settings** and **Activity**.
- **Settings** (one full-page view, left tabs):
  - **Agents & accounts:** sign in/out, availability, CLI version, model refresh.
  - **GitHub.**
  - **Defaults:** model/effort/access/time limit.
  - **Security:** the installation ceiling, stated once.
  - **Access key / sign out.**
- **Activity** (renamed from Operations): counts, running/queued/needs-attention lists and service health. Read-only, as it is today.
- **Project `⋯`:** Project settings (checks, defaults, GitHub remote), Rename, Archive.
- **Conversation `⋯`:** Rename, Settings for this conversation, Archive.
- **Run card states**, each with exactly one primary button:

  | State | Primary action |
  |---|---|
  | Awaiting approval | Run |
  | Running | Stop (composer button) |
  | Ask finished | none (copy/retry as icons) |
  | Edit finished | Review changes |
  | Checks passed | Commit… |
  | Committed | Publish… |
  | Failed | Retry |

## Visual prototype

[`docs/design/task-desk-prototype.html`](../design/task-desk-prototype.html) is a static, clickable mock-up of the proposed direction. Open it in a browser; a phone width shows the drawer and sheet layout. It includes:

- the sidebar with nested projects;
- a rendered answer;
- a run card in four switchable states: Ready to run, Running, Needs review, Committed;
- the composer's agent/model/mode picker;
- the review panel, stepping through Checks → Commit → Publish.

It is a target to argue with, not a spec to copy line by line. It uses `innerHTML` and Google Fonts for convenience; the product must not (vendor the three OFL fonts).

## Design system spec (starting point)

The tone is neutral and warm, close to claude.ai. Everything comes from tokens, in both light and dark themes.

```css
:root {
  /* type: one family, 6 sizes */
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;     /* UI */
  --font-serif: "Source Serif 4", ui-serif, Georgia, serif;                                 /* agent answers, like claude.ai */
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;                     /* code, paths, diffs */
  --text-xs: 12px; --text-sm: 13px; --text-md: 15px; --text-lg: 17px; --text-xl: 22px; --text-2xl: 28px;
  --leading: 1.55;
  /* space: 4px grid */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px;
  /* radius: 3 values */
  --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-full: 999px;
  /* light */
  --bg: #faf9f7; --surface: #ffffff; --surface-2: #f3f2ef; --border: #e7e5e0;
  --text: #1f1e1c; --text-2: #5f5d58; --text-3: #6b6963;   /* ≥ 4.7:1 on bg/surface-2 */
  --accent: #a94f2d; --accent-fg: #ffffff;           /* 5.5:1 */        /* one warm accent for primary actions */
  --ok: #276a43; --warn: #855500; --danger: #b3261e; --info: #2d62c8;
  --diff-add: #e6f4ea; --diff-del: #fbe9e7;
  --shadow-1: 0 1px 2px rgb(0 0 0 / .06); --shadow-2: 0 8px 24px rgb(0 0 0 / .10);
}
@media (prefers-color-scheme: dark) { :root {
  --bg: #1a1a18; --surface: #232321; --surface-2: #2b2b28; --border: #3a3935;
  --text: #ecebe7; --text-2: #b1afa9; --text-3: #9a9892;
  --accent: #d97757; --diff-add: #1f3a2a; --diff-del: #43201c;
} }
```

Rules:

- **Buttons:** primary (filled accent), secondary (surface + border), ghost (text) and icon (32/44 px). Only one primary per view.
- **Motion:** 120–180 ms ease-out for hover and disclosure, 240 ms for sheets and drawers. Respect `prefers-reduced-motion`.
- **Icons:** one set, inline SVG, 16/20 px, 1.5 px stroke (e.g. Lucide, vendored as a static sprite with no runtime dependency, to keep "no runtime npm deps").
- **Copy:** sentence case, verbs on buttons ("Run", "Review changes", "Commit"), no marketing taglines inside the product, and no internal terms. Hide *worktree*, *revision hash*, *installation ceiling*, *adapter* and *fingerprint*, or keep them in Details only.

## Suggested order

1. U1 (decision needed), U2 and U13: the core journey works and reads well.
2. U3–U6 and U9: new information architecture, removing duplicates.
3. U16 and U18: tokens, then mobile shell.
4. U11, U12, U14 and U15: flow polish.
5. U10, U17 and U19: copy, details and accessibility.

Constraints Codex should keep:

- No `innerHTML` (the Markdown and diff renderers must build nodes).
- CSP `script-src 'self'`, so no CDN scripts or fonts. Vendor or use system fonts.
- No runtime npm dependencies.
- Approval semantics and fingerprints unchanged. This is a presentation-layer redesign.

Given that `app.js` is a 69 KB single file (engineering review R2), it may be worth splitting it into ES modules per view as part of this work. The redesign is the natural moment.
