# GUI account setup

Open **Operations** and choose **Sign in** or **Reconnect account** for an installed agent. Finish or stop active and queued work first. Existing login credentials are retained until the new login succeeds and its subscription status is verified.

- Claude opens its subscription authorization page. After approving, paste the one-time code into the masked field in agentd and select **Complete sign-in**.
- Codex displays its native device authorization page and code. Enter that code on OpenAI's page; agentd waits for the native CLI to complete. Device-code login must be enabled in the account or workspace settings.
- **Sign out** asks for confirmation, runs the native logout command, and verifies that credentials are no longer present on this server. It does not revoke sessions on other devices.
- **Refresh account status** bypasses the normal five-minute cache. A saved login does not guarantee that the provider will accept the next request or that usage remains available.

Sign-in expires after ten minutes and can be cancelled. Closing the dialog keeps the flow available through **View sign-in** in the same browser session. Signing out of the task desk cancels that browser's in-progress flow when the runner is reachable. Restarting the daemon terminates the flow; start a new one after reconnecting.

## Security boundary

The authenticated HTTPS gateway offers only fixed account operations. It hashes the browser session identifier and supplies the owner itself; request bodies cannot choose another owner. Only that session can read authorization links, view device codes, submit Claude's one-time code, or cancel its flow. POSTs retain the same-origin checks. Responses are not cached.

The daemon executes fixed native login/logout commands with no shell and a minimal environment. New logins use an empty private profile outside every project. They cannot load project instructions. Passwords are entered on the provider website, never into agentd. URLs are accepted only for known provider authorization endpoints and expected Claude callback destinations.

The new native credentials are checked before being promoted to the service account's profile. Only the selected adapter's credential file and Claude account metadata are promoted; existing unrelated settings are preserved. Files use mode 0600, directories use 0700, and symlink/non-regular/oversized credential files are rejected. Failed or cancelled login attempts leave the saved credentials untouched. The temporary profile, including native login diagnostics, is removed on completion or on the next startup after an abrupt interruption.

Native output and authorization codes are never written to task logs or audit records by agentd. The audit records contain only account action and adapter. Authorization URLs/codes remain in memory while needed and are cleared on completion. The task and check scheduler remains locked until the native account process has exited and verification finishes. The account manager has no root or sudo privileges; workers cannot see its profiles or control socket.

## Limits

This implements guided login and manual reconnect. Durable renewal of refresh tokens produced inside disposable workers is still a separate backlog item; agentd does not copy worker-modified credential files back into the trusted profile. Codex execution remains disabled by the existing worker policy even after a successful account login. Usage/credit reporting, automatic retry, and privileged administration remain separate work.

Validated against Claude Code 2.1.283 and Codex CLI 0.157.1. Native login startup was checked in empty profiles without completing authorization; the operator completed and verified live Claude reconnection through the GUI on 2026-09-28. Full Codex browser consent remains a separate acceptance check.

References: [OpenAI headless authentication](https://learn.chatgpt.com/docs/auth#login-on-headless-devices), [Claude CLI authentication commands](https://code.claude.com/docs/en/cli-reference).
