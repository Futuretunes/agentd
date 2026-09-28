# Recover a stopped run

Open **Operations → Open & recover**, or return to the conversation. The latest failed, timed-out, interrupted or cancelled run offers **Retry run** when its adapter and work mode are available.

1. Read the failure and output. If the provider reports an expired login, use **Account status → Reconnect account** first.
2. For an editing run, select **Review changes**. Either commit the reviewed changes and continue with a new message, or discard the review before retrying. Discarding a review retains the original files; it does not copy them to the new attempt.
3. Select **Retry run** and confirm. The new attempt contains the same prompt, images, adapter, work mode, parent context and pinned Git revision. Later repository changes and the failed attempt's output are not incorporated.
4. Review the new attempt and select **Approve & run**. Only then does a model run in a fresh worktree. Subscription usage can be consumed by that run.

A retry starts over; it does not resume a native session or extend the timeout. A timed-out task may need a smaller follow-up request instead. The original run, log, files and review remain available. Successful or committed work uses normal follow-up messages, not retry.

## Guardrails

Only the latest conversation turn can create a retry. Archived workspaces, unresolved reviews, missing image files and unavailable agents block new attempts. Extra request fields cannot replace the original inputs. The current policy and executable availability are checked again when approving and dispatching.

Retries use a durable unique link to the prior attempt. Repeated requests, including after service restart, return that same attempt rather than creating duplicates or starting work. If an attempt itself fails or is cancelled, retry that latest attempt. The audit records the two task IDs without prompt, image content or credentials.

The HTTPS action retains authentication and same-origin protection. Worker isolation, provider networking, account-change locking and separate commit approval are unchanged. No automatic retries or model calls occur while installing the release.
