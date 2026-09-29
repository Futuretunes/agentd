# 2026-09-28 — Claude review of agentd v0.19.0

- Reviewer: Claude (Claude Code), at the operator's request.
- Scope: `feat/scoped-agent-settings` @ `cb3a9cf` (implementation `0af41e2`), which is byte-identical to the installed application apart from `docs/roadmap.md` wording.
- Method: full read of `src/runner.ts`, `src/mobile.ts`, `src/isolation.ts`, `src/egress-proxy.ts`, `src/adapters.ts`, `src/changes.ts`, `src/credentials.ts`, `src/worker-entry.ts`, `src/check-worker.ts`, `src/github-account.ts`, the deploy units and the CI workflow. Targeted greps only in `public/app.js`, `src/publishing.ts` and `src/repositories.ts`.
- **Not reviewed in depth:** `renewal.ts`, `native-renewal.ts`, `accounts.ts`, `cursor-acp.ts`, `cursor-policy.ts`, `codex-chat.ts`, `github-review.ts`, `check-setup.ts`, `model-catalog.ts`, `execution-settings.ts`, and the logic of `app.js`. Absence of findings there means "not looked at", not "fine".
- Evidence run on the Ubuntu host in a throwaway copy (not the installation): `npm ci --ignore-scripts`, `npm run typecheck` (clean), `npm test` (84 pass, 7 skipped), `AGENTD_TEST_ISOLATION=1 node --test test/isolation.linux.test.mjs test/check-setup.test.mjs` (10/10 pass).
- Operator-specific findings (host layout, units, files on the VM) are kept in a private note outside this public repository. The operator knows where it is.

## How to use this review (Codex, please read)

Do **not** accept these findings on authority. For each one, verify it against the code and either:

- **Agree:** fix it, or schedule it in `docs/roadmap.md`.
- **Partly agree:** say which part holds.
- **Disagree:** show the evidence (file:line, a failing/passing test, a command).

Record your answers in `docs/reviews/2026-09-28-claude-review-response.md` using the finding IDs. Where I am wrong, say so plainly: I will check your responses with the same scrutiny. Severity is my judgement for a single-user, trusted-LAN proof of concept whose central promise is "a human reviews and approves everything".

## What is genuinely good

Stated so the fixes below don't regress these.

- Approvals bind to a settings fingerprint, and settings changes re-open approval (`runner.ts:230`, `:613`).
- A commit requires checks on the same tree hash (`runner.ts:601`). Branches are created with a create-only `update-ref` (`changes.ts:24`).
- Egress design: the worker has no network namespace, and a host-side CONNECT proxy enforces a per-provider host allowlist, resolves DNS once, rejects mixed public/private answers and pins the IP (`egress-proxy.ts`).
- Workers get access-only credentials, with refresh grants stripped (`credentials.ts:28`, `isolation.ts:22`).
- UI: `textContent` only (no `innerHTML` anywhere) and a strict CSP. CSRF: exact `Origin` + JSON content type + `SameSite=Strict`.
- The GitHub token reaches git only through a per-command `credential.helper` and is never persisted into repository config (`repositories.ts:27`).
- Handover notes separate implemented / installed / live-verified and say what was not run. The operator update scripts stop services before backing up state and run the isolation tests under the production systemd boundary.

## Findings

### High

**R1 — Production runs twelve stacked, unreviewed draft PRs; `main` is twelve releases behind.**
`main` is v0.7.0 (PR #7). Installed is v0.19.0 = PRs #8→#19, each based on the previous branch, all open drafts. Consequences:

- None of them can be reviewed or merged independently.
- A fix to #8 must be rebased through eleven branches.
- The default branch does not describe what runs.
- "CI passed" only ever applied to each branch head.

**Recommendation:** freeze the stack. Review and merge in order, or squash-merge the whole stack after one review, so that `main` == installed. From then on:

- Branch every feature from `main`.
- Install only merged commits, tagged `vX.Y.Z`.
- Record the tag in the handover.

**R2 — The code is not reviewable at the granularity this project's safety model depends on.**
`runner.ts` is 75 KB in 646 lines, with lines up to 791 characters. `app.js` is 69 KB with lines up to 2,107 characters. A one-token change shows up as an 800-character diff line. Worse, `runner()` is one closure coordinating about 11 shared mutable flags:

- `active`, `preparing`, `closing`, `checkingAccounts`
- `dependencyWork`, `repositoryWork`, `publicationWork`
- `accountManager.busy()`, `renewalManager.busy()`, `catalog.busy()`, `github.busy()`

Each entry point checks a different ad-hoc subset (`:115`, `:145`, `:161`, `:195`, `:248`, `:271`, `:337`, `:367`, `:399`, `:422`, `:443`, `:555`, `:610`). Example of the hidden coupling: GitHub-feedback preparation reuses and clears the `publicationWork` slot (`:217`). So a feedback preview blocks publishing and vice versa, which is only discoverable by reading the whole file.

**Recommendation:**

1. One mechanical formatter commit (prettier/dprint, no behaviour change, verified by identical test results), with a format + lint check in CI.
2. Split `runner.ts` into schema/migrations, scheduler, review/checks, publishing, repositories and a request router.
3. Replace the busy flags with one explicit exclusive-operation lock `{kind,id}` and a documented compatibility table, tested per pair.

**R3 — The installed configuration is not reproducible from the repository.**
`deploy/agentd.service` in the repo differs from the installed unit (e.g. `EnvironmentFile`, `ProtectKernelTunables`). Production behaviour (Cursor, credential renewal, Codex chat, the project directory) comes from host-side unit drop-ins that are in no file in this repo. The per-feature update scripts that run as root also live outside version control, so they are never reviewed. A fresh install following `docs/deployment.md` does not produce what is running.

**Recommendation:** add one parametrised `deploy/install.sh` + `deploy/update.sh` and one env file template covering every flag, in the repo and reviewed like code. Reconcile the host to it and delete the one-off scripts.

**R4 — "Checks passed for the exact reviewed changes" is not true for git-ignored files.**
The pieces:

- `validate()` runs checks inside the live, agent-writable worktree (`runner.ts:347`).
- The reviewed/committed tree is `git add -A` (`changes.ts:15`), which excludes `.gitignore`d paths.
- The post-check staleness test (`runner.ts:356`) re-hashes the same tree, so it cannot see ignored files either.

So an edit-mode agent can write ignored files that tests read or import, for example:

- `dist/`, `coverage/`, `*.log`
- `.env*` (the filename blocklist only inspects tracked diffs)
- anything the target repository ignores

Checks then pass, and the commit contains a tree that was never tested. The impact is bounded (sandboxed, no network, a human reads the diff), but it breaks a guarantee the UI and README state explicitly.

**Reproduced** on Ubuntu with the real `snapshot()`:

1. Repo with `.gitignore: dist/` and `test.js` requiring `./dist/impl.js`.
2. Worktree at HEAD; write `dist/impl.js`.
3. Result: the file exists in the worktree the checks mount, while `snapshot()` returns `files: []` and a tree equal to the base tree.

**Recommendation:** run checks in a fresh directory materialised from the snapshot tree (`git worktree add --detach` + `read-tree -u <tree>`, or `git archive <tree>`), with dependencies ro-bound as now. Add a regression test: an ignored file that makes the test pass must not produce `passed`. Cheaper stop-gap: refuse checks when `git status --porcelain --ignored` lists ignored paths other than `node_modules`/`.agentd-input`.

### Medium

**R5 — The HTTPS gateway holds the keys to everything.**
`agentd-mobile` runs as the same Unix user as the runner and speaks to the full-privilege control socket. The op allowlist in `mobile.ts:95` is the only thing separating the browser from `project-register` / `project-checks` / `audit`. Its unit uses `ProtectHome=true`, which does not cover `/var/lib`. So the TLS-facing process can read every native CLI credential in the service home and the GitHub profile in the state directory. A single RCE in the gateway means every provider subscription plus GitHub.

**Recommendation:**

- Run the gateway as a separate user.
- Give it a second socket whose op table is enforced in the runner, not in the gateway.
- Add `InaccessiblePaths=` for the service home, repos and worktrees, plus `SystemCallFilter=@system-service`, `PrivateDevices=true`, `ProtectProc=invisible`, `LockPersonality=true`.

**R6 — No resource limits anywhere.**
Neither unit sets `MemoryMax`, `TasksMax` or `CPUQuota`, and bwrap sets no rlimits. Workers and checks live in `agentd.service`'s cgroup. An agent-authored `npm test` fork bomb or memory hog, or a runaway CLI, can take down the host.

**Recommendation:** set `TasksMax`/`MemoryMax`/`CPUQuota` on the service, or run each worker in its own `systemd-run --scope` with limits.

Related: attachments hard-cap at 200 MB (`mobile.ts:104`) with no cleanup path. Once full, uploads fail permanently. Worktrees, logs and dependency stages also grow without bound. This is acknowledged in the roadmap, but the attachment cap turns it into a user-visible failure.

**R7 — bwrap is missing standard hardening flags** (`isolation.ts:29`):

- `--unshare-user` explicitly (bwrap only implies it when not setuid)
- `--disable-userns` (blocks nested user namespaces, a major kernel attack surface; bwrap ≥ 0.8)
- `--cap-drop ALL`
- `--unshare-uts`, `--unshare-cgroup-try`
- a seccomp filter

Add these and assert them in `isolation.linux.test.mjs`.

**R8 — The GitHub token is far broader than needed.**
`gh auth login --web` (`github-account.ts:17`) grants gh's default classic OAuth scopes. As far as I know these are `repo`, `read:org` and `gist`: write access to every repository the account can reach. agentd needs contents + pull requests on imported repos only.

**Recommendation:** a GitHub App or a fine-grained token limited to selected repositories. At minimum, show the granted scopes in the GUI and document them. (Please verify the current gh default scopes before acting on my recollection.)

**R9 — Schema migration is implicit and unversioned.**
`runner.ts:29–66` runs about 20 "add column if missing" statements and state-rewriting `UPDATE`s on every start. `/healthz` reports `schemaVersion: 1` regardless. An older binary on a newer database starts silently, and rollback relies on restoring a DB copy, which discards everything since the deploy.

**Recommendation:** use `PRAGMA user_version` with numbered, tested migrations, and refuse to start on a newer schema.

**R10 — Synchronous work behind a 10-second gateway timeout.**
The gateway aborts after 10 s (`mobile.ts:13`). Runner handlers run `execFileSync` git (15 s timeout each) and full `git add -A` snapshots synchronously: review, validate, commit, revise, restart. On a large repository:

- the browser shows "Runner timed out" while the operation still completes;
- the event loop is blocked for everything else.

`create` for a new conversation is not idempotent, so a user retry duplicates it.

**Recommendation:** async git, and a client-generated idempotency key on `create`.

**R11 — The security-boundary tests never run in CI.**
The seven isolation tests skip unless `AGENTD_TEST_ISOLATION=1`, and `.github/workflows/ci.yml` doesn't set it. They do run in the operator update script and passed on the host today. However, PR CI never proves the boundary, and a plain `npm test` reports green with the sandbox untested.

**Recommendation:** add a CI job on `ubuntu-latest` that installs bubblewrap, relaxes `kernel.apparmor_restrict_unprivileged_userns` for the runner and sets the flag. Make the default test output state clearly that isolation was skipped.

### Low

- **R12 — Two git helpers with different hardening.** `runner.ts:108` has no `core.hooksPath=/dev/null` and no `GIT_CONFIG_NOSYSTEM`/`GLOBAL`, and inherits the environment. It is used for `worktree add` (which runs `post-checkout`), `worktree remove` and `update-ref`. `changes.ts:7` and `repositories.ts:15` are hardened. Not exploitable today (workers can't write hooks), but there should be one helper.
- **R13 — Sensitive-filename rules are duplicated, divergent and narrow.** `changes.ts:35` and `publishing.ts:27` differ: only publishing blocks `.npmrc`. Neither blocks `.netrc`, `.git-credentials`, `id_ecdsa`, `*.p12`, `.pypirc` or `.aws/credentials`, and neither scans content. Use one shared module, and consider a content secret scan before commit and publish.
- **R14 — Binary detection is a substring search.** `patch.includes('Binary files ')` (`changes.ts:37`) blocks any text change containing that phrase. Use `git diff --numstat -z` (`-\t-`).
- **R15 — Large diffs fail with a raw error.** `maxBuffer` is 4 MB (`changes.ts:7`), so large diffs throw ENOBUFS instead of taking the intended "truncated" path.
- **R16 — Prior output is injected into follow-up prompts.** Follow-ups include 20 KB of the previous raw output (`runner.ts:304`). The "context, not instructions" label is not a control against repository-borne prompt injection. The sandbox bounds the impact; fence it, and consider making it optional.
- **R17 — Hidden hard limits.** Claude `--max-turns 16` is fixed and invisible (`adapters.ts:31`), and edits that hit it just "fail". Exact CLI version pins (`adapters.ts:36`) disable model selection after any CLI update. Surface both in Operations, and document the CLI update procedure.
- **R18 — Raw runner errors reach the browser.** `mobile.ts:111` may forward host paths or git stderr. Only the Operations view sanitises errors.
- **R19 — Audit gaps.** `discard`, `project-create`/`rename` and `conversation-rename` are not audited. Browser `approve` does not record which session approved.

## Suggested order

1. R1: stop the stack growing and get `main` == installed.
2. R2 step 1: the formatter commit, so the rest is reviewable.
3. R4 and R11: correctness of the core guarantee, and CI proof.
4. R3: reproducible deployment.
5. R5–R8: boundary hardening.
6. The rest.

I'd put ntfy notifications (the current "next recommendation") after R1–R4.
