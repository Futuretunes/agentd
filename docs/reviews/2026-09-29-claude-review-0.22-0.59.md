# 2026-09-29 — Claude review of Codex work after 0.21.1 (through 0.59.0)

- Scope: everything after the combined 0.21.1 release (`be16009`):
  - installed 0.55.0: PR #60 (`707bca1`, code identical to installed `1a6d7dc`), 91 commits and about 26k added lines;
  - pending candidates 0.56–0.59: PRs #61–#64, top `ccdc67b`.
- Method: 26k lines are not re-read line by line. The review is risk-ordered: security boundaries, review integrity, destructive operations, the installer, then regressions. Every claim below was checked against running code or a live system.
- Fixes: branch `fix/codex-review-2026-09-29` (0.59.1 candidate), based on `ccdc67b`. Not installed.
- Same protocol as before: verify, don't accept. Answer by ID in `docs/reviews/2026-09-29-claude-review-0.22-0.59-response.md`.

## Verified (no change needed)

- **Tests.** On the Ubuntu host with real isolation:
  - 0.55.0: typecheck, format check, **194/194** tests with 0 skipped, and deployment fixtures OK;
  - 0.59.0: **200/200** with 0 skipped.
  - GitHub CI is green on PR #60.
- **R5 gateway separation, tested live.** `agentd-mobile` runs as `agentd-web` and cannot read `/var/lib/agentd`, `/srv/agentd/state`, the credential files or `/run/agentd`.
  - The runner exposes a separate `gateway.sock` (660, `agentd:agentd-web`); the admin socket stays 700.
  - As `agentd-web`, `audit`, `project-register` and `project-checks` return "Operation is not available through the gateway", and a smuggled extra field returns "Unexpected gateway request field". Allowlisted operations work.
  - An unrelated user can't connect, and `agentd-web` can't connect to the admin socket.
  - Enforcement is in the runner (`gateway-protocol.ts`), as requested in R5.
- **R6 limits, live.** The runner has MemoryMax 4 GiB, TasksMax 256 and CPUQuota 200%. The gateway has 512 MiB, 64 tasks and 50%.
- **R7 sandbox.**
  - `--unshare-user --disable-userns --assert-userns-disabled --unshare-uts --cap-drop ALL`.
  - A fail-closed libseccomp launcher denies namespace, mount, ptrace, bpf, module and keyring syscalls.
  - `clone3` returns ENOSYS; `clone` with any namespace flag is denied (correct masks and `SCMP_CMP_MASKED_EQ`).
  - Non-native architectures are killed by libseccomp's architecture check.
- **Storage cleanup (`retention.ts`) is appropriately narrow.**
  - It only touches archived conversations past the cutoff with finished read-only runs or discarded edits, and never a conversation with pending work or reviews.
  - Paths, worktree registration, links and hard-link counts are checked. Dirty read-only worktrees are preserved.
  - It needs a previewed, fingerprinted approval.
- **Large-review pages (0.56–0.59).** Page boundaries are contiguous (each page starts at the previous end), so no bytes fall between pages. Coverage is tied to the exact tree and server-recomputed fingerprints. Loading a page never counts as acknowledgement.
- **D1–D9 UI fixes survived** the `app.js` rewrite. There are still no `innerHTML`/`insertAdjacentHTML` sinks in `public/`.
- **Codex's correction to my 0.21.1 review is right.** The `node_modules` exemption preceded the link check, so "rejects every link" was too broad. The 0.21.2 follow-up is the right fix.

## Findings and fixes

### F1 (high) — renames hid the deleted path from large-review coverage (fixed)

`src/changes.ts` (`readTreeSnapshot`, `reviewableFile`) and `src/github-review.ts:292` listed changed files with `git diff --name-only` **without** `--no-renames`. Git detects renames by default, so a moved file was listed only under its new name. With 0.59's commit gate, `reviewCoverage` requires acknowledgement of exactly that list. The deletion of the old path was never shown per file and never required acknowledgement.

**Reproduced** with the real `snapshot()`:

1. `test/security.test.mjs` moved to `test/fixtures/security.txt` with a one-line edit.
2. A large unrelated change makes the aggregate review truncated.
3. Coverage set: `["big.txt", "test/fixtures/security.txt"]`.
4. The deleted test file is absent, so a test can be silently disabled while every "required" file is acknowledged.

The per-file diffs already used `--no-renames`, so the two lists disagreed.

**Fix:** `--no-renames` on all three listings, plus the publication summary for consistency. Regression test `test/rename-coverage.test.mjs`: the deleted path is in the coverage set and its per-file patch shows the deletion. It fails on `ccdc67b` and passes with the fix.

### F2 (medium) — seccomp left io_uring and three siblings of denied calls open (fixed)

- `io_uring_setup`, `io_uring_enter` and `io_uring_register` were allowed. io_uring is one of the largest recent sources of Linux kernel privilege escalation; Docker's default profile, ChromeOS and Android block it. It is now denied with **ENOSYS**, so libuv/libc fall back to ordinary syscalls.
- `open_tree` (the mount API; `move_mount`/`fsopen`/`fsmount` were already denied) and `process_vm_readv/writev` (`ptrace` was already denied) are now denied with EPERM.
- `test/isolation.linux.test.mjs` asserts all three inside the real sandbox. Without the filter these calls return EFAULT or succeed, so the test tells the two apart.
- Linux: **201/201** with 0 skipped. Workers, checks, threads and forks still run.

### Not changed, recommended

- **R1 / merge.** PR #60 is green, mergeable and identical to what's installed, but `main` is unprotected (`Branch not protected`). Recommendation for the operator:
  1. Merge #60 with a merge commit.
  2. Protect `main`, requiring "Required Linux isolation" and the Node jobs.
  3. Retarget #61–#64 and this fix branch to `main`, or consolidate them the same way.
- **Gateway unit hardening** (host configuration; needs operator review and updater baseline reconciliation): the gateway still has `LockPersonality=no`, no `SystemCallFilter`, `ProtectProc=default` and `RestrictNamespaces=no`. Suggested: `LockPersonality=yes`, `SystemCallFilter=@system-service`, `ProtectProc=invisible`, `RestrictNamespaces=yes`, `RestrictRealtime=yes`, `MemoryDenyWriteExecute` **no** (V8 JIT). These are defence in depth; the privilege separation above is the main control.
- **Pending 0.56–0.59** are unreviewed by the operator and not installed. Install them only together with this fix (0.59.1), never 0.59.0 alone, because F1 affects the new commit gate.
