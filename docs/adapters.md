# Native adapter contract

`src/adapters.ts` is the trusted registry for native CLI integrations. Each adapter supplies an ID, display name, executable resolver, image capability and an argument builder accepting a prompt, Ask/Edit mode, and image paths. Builders return an argument array; the runner launches the executable directly, without a shell. Repository content cannot register or override adapters.

The runner owns approval, worktree setup, credential isolation, cancellation, logging and validation. An adapter cannot bypass these responsibilities. Codex retains its native read-only/workspace-write sandbox flags; Claude retains explicit tools and `dontAsk` permission handling. The image paths for Claude are included in the prompt by the runner; Codex also receives explicit image arguments.

`capabilities` exposes `adapterSchemaVersion: 1` and an `adapters` list. Each entry reports ID/name, executable installation, policy enablement, current availability, a human-readable unavailable reason, allowed modes, image support and `authentication: not_checked`. Executable paths and authentication data are not returned. Legacy `enabledAdapters` and `editAdapters` lists contain currently available choices for the phone UI.

Discovery checks for an absolute executable file accessible to the service account. It does not run `--help`, perform a login check, spend model usage, or guarantee the installed CLI's version is compatible. Native smoke tests remain part of installation validation. Availability is rechecked at creation, approval and dispatch; removal of a CLI therefore fails closed, including for queued work.

Cursor is not registered until its native invocation, authentication and security behavior are implemented and tested. Adding an adapter also requires updating the isolation credential mounts and provider egress policy; adding a command builder alone does not grant access.
