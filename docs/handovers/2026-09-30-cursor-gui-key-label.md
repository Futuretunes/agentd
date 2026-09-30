# 2026-09-30 — 0.236.0: Access key input accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in access key input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.236.0
- Branch and base:  on  (0.235.0)
- Implementation commit(s): 98e4e93
- PR: #413

## Changes and relevant files

-  keeps visible Access key label and sets .
- Package 0.236.0; HTML assertion in .

## Validation evidence

- CI green on #413; live-installed on 192.168.1.20 (0.236.0 / 0c135ff32a5f7ce2035446f9313809fba1b4d4fb).
- Archive SHA-256: 
- Revision: 

- ✔ operationsSummaryCounts keeps pending reviews out of Completed (3.482417ms)
✔ formatTerminalStatusLabel keeps Ask answers distinct from reviews (0.14575ms)
✔ adapterAccountActionLabel distinguishes disabled adapters from Sign in (0.071167ms)
✔ adapterAccountStatusLine keeps disabled signed-out muted (0.105959ms)
✔ projectNavLabel explains conversation counts for sidebar badges (0.106125ms)
✔ conversationNavLabel names threads for assistive tech (0.061458ms)
✔ brandMarkElement returns a decorative SVG diamond (2.349583ms)
✔ workspace brand uses an SVG mark instead of the text glyph (0.37025ms)
✔ disabledOptionReason explains unavailable adapter and mode choices (0.103583ms)
✔ reviewCommittedProgression prefers publish after fresh checks (0.137625ms)
✔ applySuggestionPrompt fills without submitting and parks the caret (0.100292ms)
✔ approvalSentence states one honest promise before Run (0.344291ms)
✔ noticeDismissMs keeps confirmations short and errors readable (0.082208ms)
✔ noticeRole marks errors as alerts and info as status (0.061041ms)
✔ page notice starts as a polite status region (0.305542ms)
✔ reviewProgression exposes one primary step with honest guidance (0.116875ms)
✔ composerStopControl replaces Send while a run is active (0.087291ms)
✔ composer Send and Stop expose stable accessible names (7.199709ms)
✔ liveOutputPreview keeps a trailing bounded plain-text window (0.376083ms)
✔ compact duration and active status labels stay honest and short (0.204625ms)
✔ untrusted answers render as inert text with bounded Markdown and no remote resources (1.728334ms)
✔ file review retains exact hostile lines as text and separates files with line numbers (0.702958ms)
✔ workspace has unique controls, keyboard-accessible attachment input and named navigation (3.113291ms)
✔ conversation disclosures replace browser-default triangles (0.802458ms)
✔ phone layout keeps primary controls at least 44px tall (0.296834ms)
✔ theme-color meta stays in the document head (1.972875ms)
✔ phone composer keeps Send on the same row as tools (0.219458ms)
✔ phone drawer and sheets animate with reduced-motion respect (0.208375ms)
✔ phone review footer respects the home-indicator safe area (0.367209ms)
✔ phone header respects the status-bar safe area (0.24175ms)
✔ phone login respects safe-area insets (0.157208ms)
✔ phone notice toast respects the home-indicator safe area (0.123917ms)
✔ status and outcome classes keep non-colour cues (0.31825ms)
✔ dialog close controls share a consistent 44px target (0.180167ms)
✔ dialog close buttons expose accessible names (4.4295ms)
✔ selected sidebar items keep a non-colour cue (0.436917ms)
✔ openDialog restores focus to the trigger when the dialog closes (0.158583ms)
✔ app opens dialogs through openDialog for focus restoration (2.545916ms)
✔ history search field is ready for immediate typing (2.342875ms)
✔ history search marks results busy while loading (0.621458ms)
✔ history pagination exposes a stable accessible name (1.841208ms)
✔ sidebar foot exposes a workspace tools landmark name (4.5195ms)
✔ welcome suggestion chips expose stable accessible names (4.5725ms)
✔ Escape closes run-picker and conversation menus outside dialogs (0.375834ms)
✔ conversation region marks busy while workspace refresh runs (2.902208ms)
✔ composer menus sync aria-expanded on their summaries (4.173209ms)
✔ attachment chips expose remove accessible names (2.667833ms)
✔ compose form is named and described by composer hints (1.736ms)
✔ conversation image links expose open-attachment names (0.44825ms)
✔ main desk exposes a conversation workspace landmark name (1.634209ms)
✔ login section exposes a sign-in landmark name (5.186417ms)
✔ signed-in workspace exposes a stable accessible name (7.684916ms)
✔ composer wrap exposes a complementary landmark name (2.497167ms)
✔ user-facing copy names the Activity surface, not Operations (0.806167ms)
✔ workspace offers a skip link into the conversation region (0.252958ms)
✔ setTextWithTitle keeps truncated labels discoverable (0.077417ms)
✔ emptyConversationList offers a New conversation control (0.257209ms)
✔ emptyProjectList offers a New project control (0.118375ms)
✔ sidebar New conversation exposes a stable accessible name (1.387ms)
✔ Send arrow glyph is decorative beside its accessible name (1.338375ms)
✔ composer hints announce changes politely (0.420708ms)
✔ noProjectActionReason explains blocked new/send without a project (0.075083ms)
✔ connection status hides the decorative bullet from assistive tech (0.209417ms)
✔ login access key is autofocused (7.256958ms)
✔ workspace dialogs expose labelled headings (11.44375ms)
✔ file review shows every hunk line, including content that looks like a patch header (1.042833ms)
✔ patch metadata becomes file status, names come from headers and counts exclude headers (0.226083ms)
✔ review and run content announce updates politely (4.002459ms)
✔ conversation workspace header exposes a landmark name (10.545875ms)
✔ page notice toast announces politely (10.445208ms)
✔ thread title is described by the project name (10.375917ms)
✔ review stats announce updates politely (7.999375ms)
✔ history results expose a stable accessible name (1.831042ms)
✔ history form exposes a stable accessible name (14.222791ms)
✔ review actions expose a stable accessible name (8.505333ms)
✔ project form exposes a stable accessible name (5.772375ms)
✔ revision status announces updates politely (2.303209ms)
✔ repository form exposes a stable accessible name (5.119291ms)
✔ repository import form exposes a stable accessible name (7.256167ms)
✔ revision form exposes a stable accessible name (8.445167ms)
✔ publishing form exposes a stable accessible name (4.602875ms)
✔ publication confirm form exposes a stable accessible name (6.381375ms)
✔ login form exposes a stable accessible name (1.827916ms)
✔ access key content announces updates politely (1.898625ms)
✔ feedback form exposes a stable accessible name (2.059709ms)
✔ project info exposes a stable accessible name (2.079083ms)
✔ settings accounts expose a stable accessible name (1.871417ms)
✔ operations content exposes a stable accessible name (1.705542ms)
✔ github content exposes a stable accessible name (6.914291ms)
✔ check setup content exposes a stable accessible name (5.32825ms)
✔ updates content exposes a stable accessible name (1.797334ms)
✔ cli content exposes a stable accessible name (1.437417ms)
✔ diagnostics content exposes a stable accessible name (1.422ms)
✔ configuration content exposes a stable accessible name (1.706416ms)
✔ backups content exposes a stable accessible name (1.759083ms)
✔ publishing content exposes a stable accessible name (1.442417ms)
✔ repository status exposes a stable accessible name (1.455125ms)
✔ review content exposes a stable accessible name (1.849875ms)
✔ run content exposes a stable accessible name (2.27275ms)
✔ feedback content exposes a stable accessible name (1.87425ms)
✔ project info announces updates politely (2.038917ms)
✔ phone drawer clears left safe-area inset (0.425209ms)
✔ phone conversation region clears horizontal safe-area insets (0.221666ms)
✔ phone composer clears horizontal safe-area insets (0.288459ms)
✔ phone dialogs clear horizontal safe-area insets (0.27925ms)
✔ phone conversation header clears horizontal safe-area insets (0.244042ms)
✔ phone notice toast clears horizontal safe-area insets (0.195708ms)
✔ phone review sticky footer clears horizontal safe-area insets (0.230916ms)
✔ phone drawer clears right safe-area inset (0.138416ms)
✔ access key content exposes a stable accessible name (1.804917ms)
✔ revision status exposes a stable accessible name (1.676166ms)
✔ draft hint exposes a stable accessible name (1.375334ms)
✔ policy hint exposes a stable accessible name (1.700167ms)
✔ composer hint exposes a stable accessible name (1.794083ms)
✔ selection summary exposes a stable accessible name (2.14625ms)
✔ agent reasons expose a stable accessible name (1.617958ms)
✔ picker summary exposes a stable accessible name (1.361625ms)
✔ picker mode exposes a stable accessible name (1.274834ms)
✔ review stats expose a stable accessible name (1.2785ms)
✔ page notice exposes a stable accessible name (1.517583ms)
✔ connection status exposes a stable accessible name (1.602125ms)
✔ publication confirm error exposes a stable accessible name (1.38025ms)
✔ publication confirm text exposes a stable accessible name (1.316333ms)
✔ phone dialogs clear top safe-area inset (0.158375ms)
✔ skip link clears top and left safe-area insets (0.227833ms)
✔ phone conversation menu panel clears bottom safe-area (0.189209ms)
✔ picker panel clears phone safe-area insets (0.284291ms)
✔ phone drawer width clears left safe-area (0.145125ms)
✔ appearance theme exposes a visible label (1.521583ms)
✔ history filter exposes a visible label (2.074625ms)
✔ action row labels use compact muted spacing (0.339417ms)
✔ settings section labels use compact muted spacing (0.190417ms)
✔ dialog labels use muted color (0.151083ms)
✔ login labels use muted color (0.134958ms)
✔ dialog form first labels drop top margin (0.124583ms)
✔ repository branch exposes a stable accessible name (1.692417ms)
✔ publishing target exposes a stable accessible name (1.924292ms)
✔ feedback target exposes a stable accessible name (15.542208ms)
✔ publishing base exposes a stable accessible name (1.620917ms)
✔ feedback base exposes a stable accessible name (1.976625ms)
✔ publishing title exposes a stable accessible name (1.818208ms)
✔ publishing body exposes a stable accessible name (1.634833ms)
✔ revision prompt exposes a stable accessible name (1.449417ms)
✔ repository url exposes a stable accessible name (12.798458ms)
✔ repository name exposes a stable accessible name (1.661625ms)
✔ project input exposes a stable accessible name (1.814959ms)
✔ mode select exposes a stable accessible name (1.897625ms)
✔ adapter select exposes a stable accessible name (1.984083ms)
✔ access key input exposes a stable accessible name (1.763833ms)
ℹ tests 149
ℹ suites 0
ℹ pass 149
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 624.967792

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.235.0 / revert of #413.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #413 and live-installed 0.236.0.
2. Label history search input next.
