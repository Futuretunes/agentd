# Workspace history and recovery

Version 0.12.0 adds four GUI workflows without changing worker isolation, provider policy or approval requirements.

## Find earlier work

Open **History** to search project names, conversation titles and the messages you submitted. Choose Active, Archived or All work. Search is literal: `%`, `_` and quotation marks do not act as query operators. Results are grouped by conversation and listed from newest-created conversation to oldest, in pages of fifty. Model outputs are not searched. Open a conversation and use **Earlier turns** to page beyond the latest thirty messages; **Latest turns** returns to the current conversation end. Sending and retrying are disabled while viewing an earlier page.

## Archive and restore

Use **Project details → Archive project** or the conversation's **Archive** button. Files, commits, worktrees and history are retained. Pending runs, unresolved edit reviews and active checks must finish or be resolved first. Archived work cannot accept new runs.

History's Archived filter offers restoration. Restore a project first, then restore any individually archived conversations you want to reopen. Restoring a project preserves each conversation's own archive choice. Empty archived projects appear separately so they are recoverable too. Opening archived work is read-only; it does not restore or run it implicitly.

## See what happened

Each turn has **Run activity**, showing its recorded approval, queue, execution and completion/stop events with timestamps. The output updates while the panel is open. These are recorded state changes, not an invented completion percentage. **Download latest output** returns plain text through the authenticated gateway. The screen shows the latest 60 KB; downloads contain up to the latest 512 KB and explicitly label omitted earlier output. It is an excerpt, not a complete export of arbitrarily large logs. Native task output can contain project information; download only to a device you trust.

## Recover unsent drafts

Text, selected agent/mode and references to already uploaded images are saved per project/conversation in this browser tab's session storage. Switch conversations or refresh to recover the draft. Successful submission removes it; a failed submission retains it. Signing out or an expired server session clears saved drafts. Drafts are not synchronized across devices, are not sent to a model, and do not contain account login credentials. Browser storage failure leaves the message in the editor and displays a warning. Closing the tab normally ends this storage lifetime, although browser session-restoration behavior can vary.

## Validation and rollout

Server regression tests cover restoration across restart, pending-work guards, literal search, cursor pagination without duplicate/missing turns, bounded downloads and gateway authentication/same-origin checks. Browser fixture checks cover draft recovery after refresh, per-project separation, clearing on sign-out, search within older messages, archive restoration, run timelines and a 390-pixel phone viewport. The fixtures invoke no provider models and use no production account credentials.

The deployment keeps existing service policy and credentials, backs up application/task state, runs the Linux suite, checks native sandbox startup without prompts and verifies the new version and read-only history endpoints. No schema migration is needed: archive flags and event history already exist. Rollback restores application/task state, never older account credentials. Live phone acceptance after installation remains an operator step.
