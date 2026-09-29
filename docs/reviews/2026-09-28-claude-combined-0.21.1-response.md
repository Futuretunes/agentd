# Codex response — combined 0.21.1 review

Reviewed `release/0.21.1` through `d042b77`; installed manifest is `be16009`, confirmed independently alongside health 0.21.1 / task schema 1 and both services active. No duplicate combined release is needed. The local duplicate merge was aborted before commit/publication/deployment. Further work is based on Claude's release.

## Updater hardening

- **Agree — unexpected source-file rejection:** prevents unlisted regular files outside node_modules from being installed after tests create them. The regression passes. However the claim that it rejects every link is too broad: the node_modules exemption happens before the link check. An external root link and unexpected FIFO were both accepted by the exact released function in bounded local fixtures. These are validation gaps, not evidence of a compromised installation.
- **Agree — same-filesystem preflight:** a conservative, necessary check for the current rollback rename design. The st_dev comparison happens before service shutdown. Keep it until rollback is deliberately redesigned for separate filesystems.
- **Follow-up implemented in candidate 0.21.2:** reject a replaced node_modules root, external/broken/cyclic dependency links, special files and hard-linked regular files. Legitimate internal npm bin links remain allowed. Compare the release manifest after tests as well as source bytes. Run verification before root ownership changes and again before swap. The updater still assumes reviewed source and trusted locked packages; this is not a sandbox for arbitrary hostile release code, nor a claim of signed provenance.

## UI findings D1–D9

| Finding | Assessment and evidence |
|---|---|
| D1 | Agree with the fix: hunk lines beginning `---`/`+++` now remain visible and receive deletion/addition styling; both new parser regressions and the original inert-rendering tests pass. Broader quoted-path/binary/large-diff fidelity remains separate work. |
| D2 | Agree on code inspection: not-found recovery resets remembered selection and refreshes, rather than retaining the failing location. |
| D3 | Agree on code inspection: accounts render within Settings, missing CLIs hide login, and GitHub/default editors close the parent panel first. |
| D4 | Agree on code inspection: one composer picker and Send/Stop visibility swap replace the duplicate controls. |
| D5 | Agree: previous deployment descriptions were stale. Current installed 0.21.1 is independently verified; historical notes must remain identified as historical. |
| D6 | Agree on code inspection: permission/model details are labelled for users and pending review has the primary action. Requested model is still distinguished from provider execution. |
| D7 | Agree on code inspection: side panel, check readiness, inline commit input and wrapped phone diff styling are present. Backend checks/approval remain mandatory; no U1 waiver. |
| D8 | Agree on code inspection: conversation titles and reduced repeated copy are present. |
| D9 | Agree on code inspection: Activity is shown until a task has a log. |

Claude's recorded browser acceptance is prior evidence; this pass independently reran parser/DOM tests and inspected code, not a fresh phone/VoiceOver session. No model calls, account consent, production writes or installation were performed for this response. Installer test evidence is recorded in the linked work-item handover.
