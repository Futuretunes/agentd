# Durable native credential renewal

Version 0.11.0 adds opt-in `AGENTD_CREDENTIAL_RENEWAL=1`. It requires hardened worker isolation. An approved task stays queued while its account is prepared. A healthy access token with at least twenty minutes remaining is reused; otherwise the native CLI renews it before dispatch. Unknown expiry triggers renewal. There is no background model request and no new API billing path.

Claude 2.1.283 uses its documented `claude auth login --claudeai` refresh-token environment flow. Codex 0.157.1 uses `app-server` with only initialize and `account/read` (`refreshToken: true`). The helper never creates a thread, submits a prompt, accepts tool requests, or imports a repository configuration. Version changes fail closed pending validation. Native account providers can revoke or expire the underlying grant; renewal cannot replace required human consent.

References: [Claude authentication environment variables](https://code.claude.com/docs/en/env-vars) and [Codex account/read](https://learn.chatgpt.com/docs/app-server#1-check-auth-state).

## Trust and durability

A trusted authentication helper runs in a separate bubblewrap sandbox: empty read-only working directory, selected-provider egress, a dedicated persistent profile, and no project, Git metadata, daemon control socket or other provider credentials. A worker cannot access this profile. Native stdout/stderr never reach task logs or the GUI. Refresh tokens are passed only to the selected native authentication process, not through shell arguments.

The profile and renewal journal live under `/var/lib/agentd/.agentd-renewal`, outside task state. Credentials are written with private permissions, fsynced, atomically renamed and followed by a directory fsync. A journal records the previous credential fingerprint before the exchange. A safely saved rotation can be recovered after an interrupted process or native error. An uncertain exchange without a saved replacement blocks work and requests GUI reconnection rather than replaying a potentially consumed token. A newer GUI login or logout supersedes an earlier pending renewal. No software can recover a rotation lost between the provider issuing it and the native CLI saving it; that case needs reconnection.

Only this trusted profile can publish renewed credentials. Credentials from task workspaces are never copied back. Workers receive disposable access-token snapshots without refresh grants. Claude uses its native access-token environment option; Codex receives an empty refresh token and a fresh local timestamp. A rejected or unexpectedly expired access token can fail that run; use the normal GUI recovery flow. Workers cannot silently rotate the durable grant.

Renewal excludes login/logout, account probes, other dispatch and checks. Cancellation while preparing leaves the task cancelled and never dispatches it. Service shutdown stops the authentication process group and reconciles any saved rotation. Operations reports renewal/readiness/reconnect messages, with no tokens or provider identity details.

## Installation and recovery

Run the release installer as the administrator after pending work finishes. It tests the Linux boundary and performs one authentication-only renewal for each installed subscription. It does not submit a model task. Refresh grants may rotate during this check. On failure, application/task state rolls back, but credentials and the renewal journal must never be restored from an older backup. Reconnect in Operations if a grant is no longer usable.

After installation, approve a short Claude task and a Codex Chat only task from the GUI. This is the remaining end-to-end acceptance check for the new access-only worker snapshots. Existing Codex project inspection/editing restrictions remain unchanged.

Independent tests cover rotation after native errors, restart recovery, uncertain exchange rejection, reconnect/logout supersession, malformed/symlink credentials, private snapshots, account/task exclusion, cancellation and the Linux profile boundary. The actual provider exchanges require the explicit live preflight; synthetic tests cannot prove a provider's current grant validity.

## Cursor

Cursor v0.18 adds native browser sign-in, reconnect and sign-out in Operations. The tested CLI does not expose reliable browser-subscription renewal; expiring sessions require reconnect, while workers receive access tokens only. See [Cursor account behavior and limits](cursor.md).
