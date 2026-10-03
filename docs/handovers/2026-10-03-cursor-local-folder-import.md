# 2026-10-03 — 0.605.0: Use local folder project import

- Author/agent: Cursor
- Requested outcome: Create project can register an absolute folder on the AgentD server (empty, without Git, or an existing Git repository) from allowlisted roots, with a content-bound preview, step-up approval and a handover scaffold
- Status: revised after review; [PR #1143](https://github.com/Futuretunes/agentd/pull/1143) open, not merged or deployed
- Release: 0.605.0 (candidate)
- Branch: `feat/local-folder-import`

## Revision after review (2026-10-03)

The first version had four confirmed bugs: a subfolder of a parent repository got a nested `git init`; a gitignored `node_modules` containing symlinks blocked import; the existing-repository preview listed handover files it would never create; and a `headersSent` no-op in `mobile.ts` could leave requests hanging. All four are fixed and covered by regression tests. The design changes are:

- **Repository boundaries.** Any `.git` entry or bare-looking metadata in an ancestor refuses the selection ("choose the repository root"). Nested repositories below the selection, worktrees and `.git` files, symlinked `.git`, `commondir`/`gitdir`/alternates and incomplete `.git` directories (empty or non-empty folders) are refused. Unborn repositories are refused.
- **Ignore rules first.** A temporary `GIT_DIR` lists ignored and candidate paths with Git's own ignore semantics. The no-follow walker never enters ignored paths, so `node_modules`, `.venv`, `target` and `dist` never count against limits, and their symlinks or nested repositories are irrelevant. The walker and Git's listing must agree exactly. Traversal (entries and depth), Git output and the ignored list are bounded.
- **Content-bound snapshot.** The snapshot covers:
  - the canonical path, the root's device and inode, and the ancestor chain;
  - the detected case;
  - exact relative paths, modes and executable bits, with SHA-256 and Git blob digests;
  - ignored and refused paths and findings;
  - the handover files with their exact content, and the exact operations.

  Each candidate is read with `O_NOFOLLOW|O_NONBLOCK`, `fstat`-checked (regular file, same inode as listed, one link, not sparse, at most 1 MB) and re-`fstat`-checked after reading. A same-size edit with restored timestamps changes the snapshot.
- **Durable, async, owned job.** `src/local-folder-jobs.ts` runs in its own `operationSlot("local-folder")` and is part of the admission table (`localFolder`). It conflicts with task work, repository, publication, dependency and GitHub work, and project delete and purge. The SQLite journal `local_folder_jobs` records phases: approved, git_initialized, handover_created, committed, registered. Each phase re-checks the held root descriptor, the device and inode, and the ancestors. The commit is written with `git fast-import` from bytes re-read and verified against the approved digests, never by `git add`. `ls-tree` must match the approved list exactly, then `read-tree` sets the index. Registration and job success share one transaction.
- **Recovery.** At startup, a job still running becomes `recovery_required`; an existing-repository job becomes `failed` instead, because it never writes. Resume repeats only idempotent steps for the exact approved plan. Rollback removes only:
  - files AgentD created whose digest still matches;
  - empty directories AgentD created;
  - a `.git` whose inode AgentD journaled, or a provably empty repository AgentD started to create.

  Anything unverifiable stays in place and the job stays `recovery_required`. Repeated approval with the same fingerprint returns the same job. Audit records approval, registration, cancellation, failure, rollback and preview refusals without host paths or filenames.
- **Sensitive data fails closed.** Credential filenames, credential content, binary or invalid UTF-8, oversized, sparse, hard-linked, unreadable, special files and symlinks block approval and are listed in the preview; nothing is silently excluded. Untracked, unignored credential files in an existing repository also block. Protected locations now include account profiles (`.ssh`, `.aws`, `.gnupg`, GitHub CLI, Claude/Codex/Cursor, AgentD state) and AgentD deployment and backup paths. A selection that contains account material, such as a home directory, is refused even under an allowlisted root. AgentD's managed projects directory is no longer an import root; only `AGENTD_LOCAL_PROJECT_ROOTS` counts.
- **Existing repositories are vetted, never modified.** Hooks, `core.hooksPath`, filters, diff/merge drivers, includes, `core.sshCommand` and other command-bearing keys, credential helpers, URL rewrites, `http.*` and protocol overrides, aliases, submodule configuration, credential-bearing or `ext::` remote URLs and worktree/config indirection all refuse registration. Inspection runs Git with `GIT_OPTIONAL_LOCKS=0` and the shared hardened policy, and a test proves `.git` is byte-identical afterwards.
- **GUI.** `public/local-folder.js` shows:
  - the full canonical path, allowed-root guidance, case, stack and branch/dirty state;
  - every file to commit, grouped ignored entries, and refused files with sensitive findings;
  - each handover file's exact content, the exact operations, and whether a commit happens.

  Editing the name or path discards the preview at once, and a preview that returns after an edit is ignored. Jobs show phase progress, cancel, recovery (resume or roll back behind the access key), failure and success.
- **Static responses.** In a separate commit, `aa8b7db`, the resource is read before headers. A failure after headers destroys the socket, logs one sanitized line and never sends a second status.
- **Test hygiene.**
  - The weak assertion was removed.
  - `changes.test.mjs` waits for the job state through `test/helpers.mjs` `waitFor` instead of a longer sleep.
  - `npm test` and the isolation script use `--test-timeout=300000`, and CI jobs have `timeout-minutes: 30`.
  - `test/path-helpers.test.mjs` fails if `import.meta.url).pathname` returns; both preflight scripts now use `fileURLToPath`.
  - Public-error additions are one sorted block appended after main's unchanged list.

## Validation (local, macOS, checkout path with spaces)

- `npm run format:check`, `npm run typecheck`: clean.
- `node --test test/local-folder-import.test.mjs`: 16/16. It covers:
  - repository boundaries and ignore-first behaviour;
  - refused file kinds, credentials and protected paths;
  - existing-repository vetting and the same-size replacement;
  - async apply with exact tree and idempotent approval;
  - interruption after each phase with resume and rollback;
  - unverifiable rollback, a root swapped for a symlink, owner-bound cancellation and admission both ways;
  - fixed public errors and phone-gateway step-up.
- `node --test test/local-folder-ui.test.mjs`: 8/8 (exact lists, handover contents, invalidation, stale preview, progress/cancel/registration, recovery behind the key).
- `node --test test/mobile-response.test.mjs test/operation-policy.test.mjs`: pass (post-header failure; all 2^16 admission states against explicit reference expressions).
- `npm test`: 776 tests, 767 pass, 0 fail, 9 skipped. The skips are the Linux-only isolation fixtures, which CI runs with zero skips allowed.

## Remaining limitations

- Node has no `openat`/`mkdirat`, so handover creation and Git commands are path-based. The final component uses `O_EXCL|O_NOFOLLOW`, and every step re-checks the held descriptor, the device and inode, and the ancestors before and after. A swap of the selected folder between a check and the next system call could still land one write in the replacement. It is detected afterwards and the job stays `recovery_required` for the operator.
- Ignore rules exclude the user's global excludes file (`GIT_CONFIG_GLOBAL=/dev/null`). Files ignored only globally become candidates, so sensitive ones block rather than leak.
- Sensitive-content detection is the shared heuristic and does not promise complete secret detection.
- Repository configuration is vetted when the repository is registered. Later edits are covered only by the existing per-use `assertGitConfig` checks.
- Recovery actions can be run by any signed-in session with the current access key, because browser owners do not survive a restart. Cancelling a running job is bound to the owner who started it.

## Follow-up

1. Reviewer re-review of PR #1143; merge only when the reviewer approves.
2. Live install only after operator approval (not done here).
3. Operators must set `AGENTD_LOCAL_PROJECT_ROOTS`; without it the dialog explains that no roots are allowlisted.
