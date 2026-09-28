# Configurable agent environments — backlog requirements

Requested by the operator on 2026-09-28. This is a design brief, not an implemented permission switch. Implement after the GitHub workflow and Cursor CLI integration; develop the common policy model during Cursor work if useful.

## Operator experience

The operator can choose and change environment permissions from the GUI per project, per conversation (chat session), and per native agent CLI. Isolated worktrees remain the default. A project can use different effective settings for Claude, Codex and Cursor; a conversation can override the relevant project defaults without changing other conversations or projects.

Define unambiguous precedence: installation defaults → project defaults → project-specific agent settings → conversation defaults → conversation-specific agent settings. Every selection remains inside the administrator's supported maximum permissions. Display both the effective value and the source it inherits from; offer reset-to-inherited controls. Changing the selected agent recomputes and displays its policy rather than copying incompatible flags from the previous CLI.

Offer understandable presets plus advanced controls. Final preset names and capabilities need validation against each CLI. Candidate dimensions:

- Filesystem: no project access, read-only project access, writable isolated worktree, and explicitly selected additional paths with separate read/write grants.
- Tools: file reading/editing, shell execution, browser access, MCP and other available tools, with supported per-tool approval choices.
- Network: offline where feasible, provider-only, additional approved destinations, and an explicitly approved broader network profile where supportable.
- Native CLI approvals: supported provider-specific controls, mapped to a normalized policy without claiming identical behavior across providers.
- Resource limits and credential scope, exposed only where enforcement is implemented and tested.

A broader profile must explain what extra data can be read, what can be changed, and where data can be sent. Scope consent to the selected project/conversation and agent; record the actor, old/new policy and time. CLI configuration supplied by a repository, prompt or agent must not expand these grants. Daemon state, administrative sockets, host credentials and GitHub publishing credentials stay outside ordinary task access; host administration requires a separate management boundary.

## Changes at any time

The GUI remains editable while work is queued or running, but must distinguish desired settings from the policy actually applied to each attempt.

- Unstarted tasks: invalidate prior run approval when effective permissions change, and require fresh approval of the new policy.
- Running tasks: show that the existing sandbox retains its original policy. Offer an explicit stop-and-restart under the new policy, preserving partial work for review and requiring approval for the new attempt. Do not promise instantaneous revocation or silently expand a live process's permissions.
- Subsequent turns: inherit the newly selected policy; show overrides and resets clearly.
- Retries/resume: verify effective permissions and native capabilities again; bind the resulting attempt to a policy snapshot and audit it.

Commit, publish and merge approvals remain separate from environment access. Native CLI permission flags do not replace operating-system isolation. Unsupported combinations are disabled with an explanation, not mapped silently to a bypass or unrestricted mode. Failure to enforce an approved setting prevents execution.

## Acceptance

Test inheritance and each agent override, configuration changes between creation/approval/dispatch, running-task transitions, restart persistence and audit records. Verify actual filesystem/network/tool restrictions with adversarial fixture tasks, including repository configuration attempting to widen access. Verify desktop and phone controls and explanations. Clearly distinguish capability discovery from tested enforcement. Existing conversations migrate to their current restrictive policy.
