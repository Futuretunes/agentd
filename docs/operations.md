# Operations Center

The Operations Center is the first terminal-free administration surface. It is read-only: it observes tasks, service state, adapter policy and native account status without changing credentials, retrying work, or invoking models.

## Data shown

- Counts for active/waiting, queued, completed and attention-needed tasks.
- The latest 50 tasks across all projects, grouped into current work, failures and recent work.
- Project, conversation, adapter, mode, status, review status and check status for each task.
- Whether the serial runner currently has an active task and whether hardened workers are enabled.
- CLI installation/policy availability and normalized account state for every registered adapter.

The endpoint omits prompts, model output, task logs, worktree paths, executable paths and account identity. Conversation titles are shown because they already identify work throughout the task desk.

## Account and usage checks

Account checks execute only the native read-only status command (`codex login status` or `claude auth status --text`) directly, without a shell. Results are normalized to signed in, signed out, unavailable, checking or error. Raw command output is discarded so email addresses and organization names do not reach the API. Checks run asynchronously at startup and every five minutes; opening Operations never submits model work.

Neither native CLI currently provides agentd with a stable, non-interactive usage-limit interface. Operations therefore reports usage as unavailable instead of estimating credits or balances. A future adapter may supply usage only through a documented provider interface with a freshness timestamp and explicit distinction between subscription limits and metered balances.

## Scope

This release provides visibility and navigation back to the relevant conversation. Guided login, safe retry/resume, service updates, backups and other administrative mutations remain separate milestones because they require a narrowly scoped management boundary and additional approval design.
