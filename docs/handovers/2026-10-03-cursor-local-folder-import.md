# 2026-10-03 — 0.605.0: Use local folder project import

- Author/agent: Cursor
- Requested outcome: Create project can register an absolute folder on the AgentD server (empty, without Git, or an existing Git repository) from allowlisted roots, with a content-bound preview, step-up approval and a handover scaffold
- Status: revised for portable mutation-test skips (head `4a22845`); [PR #1143](https://github.com/Futuretunes/agentd/pull/1143) open, not merged or deployed
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
  - a `.git` whose inode AgentD journaled and whose complete contents still match the journaled digest (see the second revision below).

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

## Second revision after re-review (2026-10-04)

Codex's re-review of `8904f80` found four remaining gaps. Commit `80f71a1` fixes them; the branch was already at the PR head, so no rebase was needed.

1. **Nested existing repositories.** Ancestors were only checked when the selection had no `.git`, so an existing repository or worktree inside another repository was accepted. `assertRepositoryBoundary` now always checks every ancestor for a `.git` entry and for bare metadata. Test: an outer repository with a commit and an inner repository with its own commit; selecting the inner one is refused with the parent-repository error by both inspection and the runner preview, and the byte snapshot of both repositories (Git metadata and working files) is unchanged. The same test refuses a linked worktree placed inside another repository and a repository beneath bare metadata.
2. **Rollback could delete post-interruption history.** The journal now stores `gitState`, a SHA-256 over the complete `.git` tree (every path, type, permission bits, exact content or link target), recorded after `git init`, after `fast-import` and after `read-tree`. Timestamps are not used. Resume and rollback compare the current tree with that digest before touching anything, and rollback checks again immediately before removing `.git`. Any difference fails closed: the job stays `recovery_required` with "Git metadata changed after the interruption. AgentD left the repository and files for manual recovery." and nothing is deleted. For a crash after `git init` but before its digest was journaled, the expected tree is a fresh `git init` in a temporary directory. The old "provably empty repository" heuristic is gone. Tests, after an interruption and restart:
   - a user commit added: rollback and resume both refuse, and the commit, its file and the whole `.git` stay byte-identical;
   - a new branch added: refused, branch kept;
   - Git configuration changed: refused, configuration kept;
   - nothing changed: rollback succeeds and restores the original folder.

   A unit test shows the digest changes on a same-size ref edit with restored timestamps and on a permission change.
3. **Revalidation immediately before registration.** After the final commit-step reads, `verifyWorkingTree` re-checks the held root descriptor and identity. It then re-opens every candidate and handover file with `O_NOFOLLOW|O_NONBLOCK`, requires a regular single-link file with the inode recorded at the final read, and checks size, SHA-256 and mode. It verifies the Git digest and that `HEAD` is the journaled commit, and requires an empty `git status --porcelain --untracked-files=all` run with `GIT_OPTIONAL_LOCKS=0`, so no extra or missing files and no index write. It then re-checks Git and the root once more before registering. The handover phase and commit step no longer use `readFileSync`; both read without following links. On failure the import rolls back through the verified rollback. Deterministic tests use the `committed` hook, between the final read and registration, with no sleeps:
   - same-size replacement with restored timestamps, a candidate replaced by a symlink or a FIFO, a candidate removed, an untracked file added: `failed` with "Working files changed before registration…", rolled back, not registered;
   - a handover file changed (same size) or replaced by a symlink: not registered, and the operator's file is kept, so the job is `recovery_required`;
   - unchanged: succeeds with a clean status.
4. **Bidirectional task exclusion.** The admission table gains `localFolder` in `dispatch` and a new `taskApproval: ["localFolder"]` row. Task approval, the only path to `queued`, is refused with "Wait for the local folder import to finish before approving work.", and dispatch also waits. Import approval and recovery name the conflicting work, for example "Finish or cancel approved tasks before importing a local folder." for queued, preparing or running tasks. All the new texts are in the public-message list. When an import or recovery settles, the runner re-pumps. Restart recovery keeps the exclusion: running imports become `recovery_required` and free the slot, and resume or rollback must pass the same admission. The policy test now asserts that dispatch and task approval are blocked by `localFolder`, and that task approval is blocked by nothing else. Runner test, using gates rather than timing:
   - import first: approval refused and the task stays `waiting_for_approval`, then approval works after the import;
   - task first: a queued or running task refuses a new import and the folder is untouched;
   - after a restart: a running task refuses recovery, and a recovery held mid-run refuses task approval.

Each fix was checked by disabling it: the matching regression test, and only that test, fails.

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
- CI on `27e9f32`: Node 24 and 26 pass. Required Linux isolation reports 776 tests, 776 pass, 0 fail, 0 skipped (run 37160761235). The first push failed once in isolation: newer Git's detached auto-maintenance in the test fixture wrote `maintenance.lock` while the test hashed `.git`. The fixtures now disable auto-maintenance, which AgentD's shared Git policy already disables.
- Second revision (`80f71a1`):
  - `npm run format:check` and `npm run typecheck` are clean; the repository has no separate lint script.
  - `test/local-folder-import.test.mjs`: 21/21, repeated three times with identical results.
  - `test/local-folder-ui.test.mjs` and `test/operation-policy.test.mjs`: pass.
  - Local `npm test` on macOS with Node 25: 781 tests, 770 pass, 9 skipped (Linux-only), 2 fail. The 2 failures are `check-snapshot` "ignored implementation…" and `images` "image attachment validation…". They fail the same way on the unchanged base `8904f80` under full-suite load, and pass when run alone.
  - CI on `80f71a1` (runs 37164511245 and 37164509609): Node 24 and Node 26 each report 781 tests, 772 pass, 0 fail, 9 skipped. Required Linux isolation reports 781 tests, 781 pass, 0 fail, 0 skipped.
  - No test or step made a model request, changed account consent, inspected a real private folder, merged, deployed or imported a live project. Existing-repository inspection is still proven byte-identical for `.git`.

## Third revision after re-review (2026-10-04)

Codex's review of `70e50e6` reproduced a P1 rollback bug: `readNoFollow` and `unlinkSync` only no-follow the final name, so `project/docs/handover.md` followed a replaced `docs` symlink and deleted a byte-identical external `handover.md`. That violates the rule that rollback deletes only files AgentD can prove it created.

Commit `0f51a30` treats every intermediate component as security-sensitive:

- New `src/directory-handles.ts` performs Linux directory-relative operations through `/proc/self/fd/<dir>/<name>`. Each call uses one final name inside an already verified directory handle (`O_DIRECTORY|O_NOFOLLOW` for directories, `O_NOFOLLOW` for files). A successful final-component open is never treated as proof that the parents were safe.
- The job journals `dirIds` (device and inode of every directory on a handover path, created or pre-existing) before writing inside it, and journals each created file's inode.
- Reads, exclusive creates, rollback unlinks, `rmdir` and `.git` removal walk from the held project-root descriptor, reject symlinks, device changes, inode mismatches and unexpected hard links, and re-check immediately before the destructive call.
- Rollback is two-pass and fail-closed: every owned file and directory is verified first; if any parent chain is unsafe, nothing is deleted and the job stays `recovery_required`. `.git` is removed entry-by-entry against the journaled digest, through the same handles.
- If directory-relative operations are unavailable (non-Linux), mutating imports and recovery refuse up front and change nothing.
- Handover inspection now lists every missing ancestor of a generated path, not only the immediate parent.

Regression tests (deterministic seams, no sleeps):

1. Pause at `committed`, copy `docs/handover.md` to an external directory, replace `docs` with a symlink to it, resume or roll back: the external file stays byte-identical, the job is `recovery_required`, and the project is not registered. This case failed on `70e50e6` (external file deleted) and passes after the fix.
2. `handover_write:<path>` seam: replace `docs` with a symlink after the parent chain is held and before the write. AgentD does not create `handover.md` or `docs/notes/keep.md` in the external directory.
3. Replace the owned `docs` directory with a different real directory (different inode) containing copies of the generated files: rollback does not delete the replacement or its files.
4. Extra generated file `docs/notes/keep.md`; replace the intermediate `docs` component with a symlink: no external read, write or deletion.
5. Unchanged AgentD-created parent chain still rolls back to the original folder.
6. Existing final-component coverage remains: same-size replacement, symlink, FIFO, removal, untracked file, changed or replaced handover file, and the unchanged success case.

Local Linux Docker evidence on `0f51a30`:

- `npm run format:check` and `npm run typecheck` are clean.
- Focused `local-folder-import`, `local-folder-ui` and `operation-policy` suites: 34/34.
- Node 24 and Node 26 full suites: 783 tests, 774 pass, 0 fail, 9 skipped (Linux-only isolation fixtures).
- Required Linux isolation (`AGENTD_TEST_ISOLATION=1`, bubblewrap): 783 tests, 783 pass, 0 fail, 0 skipped.
- GitHub CI on `c1a9514` (runs 37195275710 and 37195272606): Node 24 and Node 26 each report 783 tests, 774 pass, 0 fail, 9 skipped. Required Linux isolation reports 783 tests, 783 pass, 0 fail, 0 skipped.
- Codex reproduction against `70e50e6` deleted the external `handover.md`; against `0f51a30` the same steps leave the file byte-identical and the job in `recovery_required`.
- Existing-repository inspection remains byte-identical for `.git`. No model request, consent change, live import, merge or deploy.

## Fourth revision after re-review (2026-10-04)

Codex found no remaining path-traversal or rollback-deletion defect in `79d0949`. The P1 directory-handle fix is unchanged.

Mutating imports still require Linux `/proc/self/fd` handles. The mutation tests in `test/local-folder-import.test.mjs` now share one skip option, `linuxMutation` (`directoryRelativeSupported()`), instead of failing on macOS with the production unsupported error. Inspection, preview, blocked-preview refusal, existing-repository read-only inspection and in-place registration, public errors, GUI tests, operation-policy tests and the phone-gateway access-key test stay portable.

A new always-on test covers non-Linux refusal without mocking the platform check: preview of an allowed non-Git folder still works; approval returns exactly `localFolderJobErrors.unsupported`; no `.git`, handover files or directories, job or project appear; original files stay byte-identical; public errors and audits contain no host path. Linux isolation forbids skipped tests, so on Linux the same test is a positive control: approval does not return that unsupported error and the import may start.

Expected portable `npm test` (macOS): 786 tests, 765 pass, 0 fail, 21 skipped (12 Linux-only local-folder mutation cases + 9 existing isolation fixtures). Focused local-folder + UI + policy: 37 tests, 25 pass, 12 skipped. Linux Node 24/26: 786 tests, 777 pass, 9 skipped. Isolation: 786/786, 0 skipped. GitHub CI on `4a22845` (runs 37196477717 and 37196474661): Node 24/26 786 tests, 777 pass, 0 fail, 9 skipped; isolation 786/786, 0 skipped. Production mutation support remains Linux-only.

## Remaining limitations

- Crashing or cancelling while AgentD's own Git command runs (`init`, `fast-import`, `read-tree`) leaves `.git` different from the journaled digest. Recovery then refuses and the operator removes `.git` by hand. This is fail-closed by design. The same applies after a crash between `git init` and journaling its digest if the import folder's filesystem makes `git init` write different config than the temporary directory (for example `core.ignorecase`).
- The `.git` digest is bounded (50,000 entries, 64 MB) and refuses beyond that. Only AgentD-created single-commit repositories are digested.
- The final revalidation is a check, then a database insert. A change after the last check and before the insert is not detected, and registration itself writes no files. Existing-repository registrations do not run the working-tree check, because they never write and may be dirty by design; their boundary, configuration and identity checks still run.
- Dispatch exclusion is defence in depth: no code path queues a task while an import holds the slot, so it is exercised by the policy test rather than a runner scenario.

- Node has no `openat`/`mkdirat`/`unlinkat`. Owned-path mutations now use Linux `/proc/self/fd/<dir>/<name>` on a held directory, so intermediate path components are no longer followed. The remaining window is only the last name inside that held directory: between the final `lstat` identity check and the `unlink`/`rmdir`/`O_EXCL` create, another process can replace that single name. Git commands (`init`, `fast-import`, `read-tree`, `status`) still take `-C` with the canonical path; a swap of the project folder between the last identity check and those Git calls can still aim Git at a replacement, after which the journaled digest or identity check fails closed. The first `open` of the project root is still path-based and is then bound to the journaled device and inode. Non-Linux hosts refuse mutating imports rather than falling back to path walks.
- Ignore rules exclude the user's global excludes file (`GIT_CONFIG_GLOBAL=/dev/null`). Files ignored only globally become candidates, so sensitive ones block rather than leak.
- Sensitive-content detection is the shared heuristic and does not promise complete secret detection.
- Repository configuration is vetted when the repository is registered. Later edits are covered only by the existing per-use `assertGitConfig` checks.
- Recovery actions can be run by any signed-in session with the current access key, because browser owners do not survive a restart. Cancelling a running job is bound to the owner who started it.

## Follow-up

1. Reviewer re-review of PR #1143; merge only when the reviewer approves.
2. Live install only after operator approval (not done here).
3. Operators must set `AGENTD_LOCAL_PROJECT_ROOTS`; without it the dialog explains that no roots are allowlisted.
