# Resource limits and safe retention (0.23)

## Limits

The managed service profile caps the entire runner group (daemon, workers, checks and subprocesses) at 4 GiB memory, 256 processes/threads and two CPU cores' worth of CPU time. Memory pressure starts at 3 GiB. The web gateway is capped at 512 MiB, 64 processes/threads and half a core, with memory pressure at 384 MiB. Both have zero swap allowance and disabled core dumps. An out-of-memory event kills the affected service group; systemd restarts it and existing startup recovery marks interrupted work. This protects the rest of the host; it is not a separate per-task cgroup or a promise of graceful handling of every OOM.

`apply_resources.py` installs the explicit `standard-v1` profile after the normal application update. It refuses existing restrictive custom policies, checks the managed drift baseline and active-work locks, preserves worker namespace hardening, verifies live kernel memory/process/CPU cgroup files and records the new baseline. Failure restores the old overrides/configuration. The private resource transaction journal remains for administrator review. Future updates fingerprint the resource properties. No deployment privilege is added to the web gateway.

Task/check stdout and stderr share an 8 MiB raw-output cap. The daemon owns the output files, consumes pipes and stops an overflowing process group; the agent receives no log file descriptor. Saved answers remain capped at 512,000 bytes. File-write failure also stops the run. Edit worktrees remain reviewable after a limit failure.

Before checkout, tracked file sizes/counts are checked against 1 GiB and 50,000 entries. During a task/check, worktree storage is examined every two seconds; excessive growth or insufficient free space stops the process group. This is a **monitored guard, not a filesystem quota**: fast writes can overshoot between checks, and unrelated filesystem consumers can exhaust space. Service cgroups bound tmpfs/memory consumption, but a dedicated filesystem/quota remains future work. New tasks/checks/dependency/repository work and uploads require a 2 GiB available disk reserve. Protected data is never deleted to force admission.

## Task cleanup in the GUI

Activity → Review storage cleanup creates a ten-minute, browser-owner-bound preview. Approval rechecks the exact inventory before any removal. There is no background task-data deletion.

Only archived conversations and tasks unchanged for at least 30 days qualify. Successful Ask/Chat runs and explicitly discarded edits can be cleaned. Active or queued siblings, unresolved edits, committed edits and failed read-only runs are kept. Unknown paths, linked files/directories, unexpected worktree changes and oversized inventories are preserved for manual review. Batches examine at most 20 old candidates.

Git removes only the registered task worktree; discarded edits require the explicit cleanup confirmation. Raw logs are replaced with a small retention notice. Saved answers and task/conversation history stay available, and follow-up context prefers the saved answer. Legacy logs without a separate answer are kept. Repository branches, pinned commits, attachments and prepared dependencies are untouched. Those collections still need their own reference-aware retention work.

Cleanup records an audit intent and result per task. A partial failure reports the affected task IDs and preserves remaining artifacts; already removed worktrees are not recreated. Metadata records successful removal immediately. The operation is not an atomic transaction spanning Git and SQLite, and abrupt crash recovery may require manual reconciliation. Previewing does not delete data.

## Deployment backups

Successful managed application backups created by this release receive root-owned provenance markers. Only these marked backups participate in automatic retention after a successful update:

- Always keep the newest three completed backups.
- Keep every backup younger than 30 days.
- Keep a backup containing a `KEEP` file.
- Pending application, gateway or resource recovery blocks pruning.
- Keep legacy/unmarked backups, failed-update backups and all configuration-migration backups.

The updater checks the prospective backup size (maximum 5 GiB), marked backup storage (maximum 20 GiB including the new backup), and sufficient free space for the backup plus a 2 GiB reserve. It refuses admission when protected backups exceed the budget. This is not a global cap on unknown/legacy backups. Protected root paths and inode/provenance checks prevent treating arbitrary directories as managed backups; symlink-safe removal is required.

An administrator can inspect `scripts/backup_retention.py plan --config …` and apply its unchanged fingerprint with `apply --fingerprint …`. The GUI cannot access or delete root-owned backups. Existing backups are deliberately not adopted by filename. The new policy does not delete any live backups during implementation/staging.

## Acceptance and remaining scope

Fixtures exercise noisy workers, checkout/growth guards, stale cleanup previews, owner checks, preserved answers/protected worktrees, linked paths, backup pinning/recovery protection and migration rollback. Actual resource cgroup acceptance occurs during the operator update; pre-install tests do not claim installation. Browser/phone acceptance and real provider tasks are separate.

Next resource work: per-worker cgroups, actual disk quotas, attachment/dependency retention with reference checks, cleanup crash reconciliation, and GUI management of privileged deployment operations through a separately reviewed service.
