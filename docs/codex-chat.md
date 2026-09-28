# Codex Chat only

Select **Codex → Chat only** to ask questions, plan, or discuss pasted text through the native CLI and your ChatGPT subscription. Every message still waits for approval. Existing conversation context is included, but no project files are mounted or inspected. This is a new capability, not the existing repository-aware Ask mode.

This first release supports text. Remove image attachments before choosing Chat only. It cannot read the repository, execute commands, edit files, browse the web, use MCP/plugins, or delegate to subagents. It cannot determine facts about project files you have not supplied as conversation text. Select Claude's Ask/Edit modes for repository work. Subscription limits still apply; usage balances remain unavailable.

## Enforced boundary

- An explicit operator setting, `AGENTD_CODEX_CHAT=1`, enables only Codex's `chat` mode. Hardened workers are mandatory. Codex `ask` and `edit` remain rejected at creation, approval and dispatch; existing pending runs do not gain permissions.
- The native CLI must report exactly `codex-cli 0.157.1`. Unvalidated upgrades fail closed. All active feature flags from its inventory are disabled; strict configuration validation, disabled web search, ignored user config/rules, ephemeral sessions, read-only sandbox and no permission escalation are fixed arguments. Prompt text is a literal argument after `--`.
- The worker sees an empty read-only working directory in place of the project. Git metadata, project configuration, instructions, hooks, plugins, daemon state and control sockets are absent. Only the Codex credential file is copied into its disposable profile. That profile is not copied back.
- The existing Linux namespaces and provider-only proxy remain in place. No host capability, namespace-policy exception, sudo or sandbox bypass is added.
- Only assistant text is forwarded to task logs. Native diagnostics are discarded. Unexpected execution events terminate the wrapper; this is an additional check, not the security boundary.

## Validation and limitations

`scripts/chat-preflight.mjs` uses the real CLI, an empty profile and a local mock Responses endpoint. It does not read service credentials or contact a model. It checks that requests advertise no tools and injects shell, patch, subagent, browser, image, code-execution and MCP calls. Native command-like calls are rejected as unsupported. The patch handler is still recognized internally, but its write is rejected by the read-only sandbox and approval policy. The test verifies the sentinel file is unchanged and no injected file is created.

Linux tests separately prove that repository files and project instructions are absent, the empty workspace is not writable, unrelated daemon state is hidden, and non-provider networking is denied. The installer also makes one short native subscription request in the real service sandbox, verifying the exact arithmetic answer. It rolls back if any check fails. A valid Codex subscription login must already exist; reconnect from Operations on the previous release if needed.

The version pin and native preflight must be revisited for CLI updates. Current official documentation is not identical to 0.157.1: for example, `tools.view_image` is ignored by that binary; this implementation uses the validated feature inventory instead. Disabling shell alone is insufficient. The mode makes no claim that the CLI contains no tool handlers; it exposes none to the model and retains independent execution restrictions.

References: [official configuration](https://learn.chatgpt.com/docs/config-file/config-reference), [native app-server documentation](https://learn.chatgpt.com/docs/app-server).
