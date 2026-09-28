# Cursor CLI integration

agentd v0.18 adds Cursor as a native account adapter. Install the prepared upgrade, open **Operations → Cursor → Sign in**, then complete Cursor's own browser consent. A cancelled/failed login preserves the previous credentials. The GUI also supports reconnect, sign-out and status refresh. No API key is requested or accepted.

Select **Cursor → Ask** to read the selected project's isolated worktree, or **Edit files** to propose changes. Every run still needs approval. Review changes, run fresh checks, approve a commit and separately approve publication through the existing workflow. This release accepts text, not images. Context from previous turns is supplied by agentd; native Cursor sessions are not durably resumed.

## Security contract

The pinned official Linux x64 CLI is `2026.09.26-dd393fe`, installed root-owned outside the service profile. Version drift fails closed. The trusted ACP client initializes without client filesystem, terminal or subagent capabilities, authenticates with `cursor_login`, creates a session with no MCP servers, and selects `ask` or `agent` mode. Literal user text is transported as JSON, never a shell command.

Permission requests receive `allow-once` only for structured file diffs inside the approved edit worktree. Ask cannot approve writes. Escaping paths, symlinks, Git metadata, attachment inputs and agent configuration/hook paths are rejected. Shell, web, MCP, unknown client requests and unstructured deletions are refused. Rejected requests and failed tool notifications prevent a successful task result. Final agent text is streamed; internal thoughts and native stderr are not published. Run cancellation terminates the complete worker process group.

The existing outer Linux isolation remains mandatory: read-only system/package mounts, only the selected worktree writable for edits, read-only Git metadata, no daemon state or control socket, and provider-only HTTPS egress. Cursor keeps `--sandbox enabled`; agentd never uses `--force`, `--yolo`, `--trust` or a sandbox bypass. Native permissions independently deny shell/MCP/web tools. Project `.cursor`/`.claude` directories and `.mcp.json` files are masked; user/team hooks, skills and plugin locations are empty and read-only. Direnv and Git hooks/fsmonitor are disabled. Prepared checks remain a separate offline approved operation.

Worker profiles contain only the selected Cursor access token and sanitized selected-team ID. The refresh grant stays in the service account. Cursor's native `CURSOR_AUTH_TOKEN` path receives the access token; the CLI may duplicate that access value into its disposable profile's refresh field, but it never receives the actual refresh secret. Provider hosts are limited to `api2.cursor.sh`, `api.cursor.sh` and `cursor.com`, on public addresses and port 443. Downloads, arbitrary hosts and other providers are not allowed.

## Account and usage limits

Cursor's native browser account is used with its existing subscription and billing settings. agentd does not enable paid overages, change account billing, or fall back to an API key. It cannot establish whether an account has on-demand billing enabled or report a reliable remaining allowance; Operations says so. Review those settings in Cursor if usage must be limited to your included plan.

The tested CLI does not expose reliable automatic renewal for browser-subscription sessions. agentd requires a readable access-token expiry with more than 20 minutes remaining; otherwise it asks for **Reconnect account** before dispatch. Claude/Codex durable renewal is unchanged. A verified native status requires successful account information, but only normalized sign-in state is returned to the GUI, never identity details or raw credentials.

## Verification

Automated tests cover native URL parsing, sanitized credential publication, access-only snapshots, ACP negotiation/output/permission refusal, Linux configuration masking and provider boundaries. The actual pinned CLI initializes inside the outer sandbox, and its browser sign-in prompt is recognized and cancelled in an empty profile. These checks submit no model request.

Operator acceptance after installation: sign in from Operations, approve a short Ask prompt about a harmless README, then an Edit request to create a small text file. Confirm the answer/change and normal review/check/commit flow. Full account consent, provider transport and live file-tool behavior remain unverified until that acceptance; startup success alone is not proof that a model run works. If the native inner sandbox or provider policy refuses work, the run fails without relaxing host protection.

References: [official ACP](https://cursor.com/docs/cli/acp), [authentication](https://cursor.com/docs/cli/reference/authentication), [permissions](https://cursor.com/docs/cli/reference/permissions).
