# Reviewable editing

Choose **Ask** for read-only questions, or **Edit files** to request changes. Every turn requires run approval. After an edit, choose **Review changes**, inspect the diff, run checks, and explicitly approve a commit. Commits create an `agentd/<task-id>` branch. The project's checked-out branch is not changed. Nothing is pushed during commit approval. Use the separate [GitHub publication approval](publishing.md) to upload the reviewed commits and create a draft pull request.

The next conversation turn starts from the preceding approved commit. Resolve the previous review before continuing. Discarding a review retains its worktree for inspection but does not carry those edits forward. Choose **Request revisions** in the review to describe adjustments before committing. The latest unresolved edit is saved as an exact snapshot and copied into a new isolated worktree only after fresh run approval. The original worktree remains available; later changes to it do not change the saved snapshot. The new review includes the complete accumulated edits against the original base and requires new checks and commit approval. No intermediate commit is created. Duplicate submissions reuse the same request, including after restart. A cancelled request that never started can be retried with its saved edits. Oversized or sensitive changes must be resolved before they can be carried forward.

## Enable on Linux

Install bubblewrap through the distribution package manager and ensure unprivileged user namespaces work under the service account and systemd restrictions. Set `AGENTD_EDITING=1` and an explicit `AGENTD_EDIT_ADAPTERS=claude` allowlist in the daemon's environment and restart it. `AGENTD_BWRAP_BIN` may override `/usr/bin/bwrap`. There is no production fallback that runs edits without this sandbox.

The outer sandbox mounts only selected system runtime files read-only, gives the worker a writable worktree and temporary home, hides daemon state/control sockets, protects Git metadata, and uses a separate PID namespace. The installed native CLI code is read-only. CLI auth files are copied internally to the disposable home, never returned by the control API. The temporary profile is removed when work finishes; startup removes leftovers from interrupted workers. Native CLIs reach an explicit provider hostname allowlist through a CONNECT broker. Direct networking is unavailable. See [worker security](worker-security.md) for setup, current Codex compatibility, and remaining limitations.

Codex uses `workspace-write`; Claude uses an explicit Read/Glob/Grep/Edit/Write tool list and `dontAsk`. There is no blanket permission bypass. See [Codex CLI reference](https://developers.openai.com/codex/cli/reference) and [Claude CLI reference](https://code.claude.com/docs/en/cli-reference).

## Configure checks

Use **Project details → Set up checks**, or **Set up checks** inside an edit review. The latter uses that review's package files, including approved changes to dependencies. Inspect the displayed `typecheck` / `test` scripts, then choose **Approve dependency preparation**. Preparation is separate from running checks and approving a commit.

The first GUI profile supports single-package npm projects with `package.json`, a version 2/3 `package-lock.json`, and an explicit test script. It downloads locked public-registry packages with SHA-512 integrity, includes development dependencies, enforces package engine compatibility, and disables all installation lifecycle scripts. Private registries, workspaces, Git/file/URL dependencies, alternate package managers and custom install flags are unsupported. A package needing generated files from install scripts may prepare successfully but fail its checks; no blanket script bypass is provided.

A dedicated bubblewrap sandbox sees only copies of the two manifests, temporary HOME/cache, selected read-only system runtime and agentd code. It has no repository, Git metadata, service state or account credentials. Its network namespace reaches only `registry.npmjs.org:443` through the existing public-address-checking broker. Provider workers do not gain registry access. The production path has no unsandboxed fallback.

Preparation requires approval bound to the exact manifest and lockfile hashes. It is serialized with repository changes, task starts, checks and account changes. Downloads have a four-minute limit and a monitored 512 MB/100,000-file staging limit (not a hard disk quota). Cancel or failure removes the incomplete set and preserves the old setup; restart marks pending jobs interrupted. Finished sets remain immutable to workers and retained on disk; retention is a future item.

After preparation, close setup and choose **Run checks** in the review. Checks run `npm --ignore-scripts run typecheck --if-present` and `npm --ignore-scripts test`, with no network or provider credentials and read-only dependencies. Explicitly selected scripts execute; automatic pre/post hooks do not. Results and commit approval remain bound to the complete reviewed tree. Missing tests or changed manifest/lockfile require setup again; there is no skip-checks commit path. A project's setup can be reused by reviews with the same package files.

Existing administrator-registered dependency sets remain supported through the private `project-checks` command; GUI setup replaces them only after successful preparation. They are not silently reinstalled during application upgrades.

See [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) for lockfile and ignore-scripts behavior. Project checks can execute arbitrary repository code inside the offline worktree sandbox; a passing command does not establish test quality. Read the scripts and diff before approval.

## Review binding

A temporary Git index captures tracked changes, new files and deletions into a tree object. Attachment input files are excluded. Both test results and commit approval refer to that exact tree. Changed content invalidates previous checks and approval. Changes made by the check commands themselves also invalidate the check result.

Large diffs, binary changes and common sensitive filenames require local resolution and cannot be committed through the interface. This filename guard is not a secret scanner. Read the diff before approving.

Commit creation uses Git plumbing with hooks disabled, and creates a new branch without changing the project checkout. Failed/cancelled edit runs can still be inspected; only an exact snapshot with passing checks can be committed. The snapshot includes all reviewable file changes, not just changes the agent mentioned in its response.

## Validation

`npm test` exercises review behavior using deterministic workers. On a Linux machine with bubblewrap, `AGENTD_TEST_ISOLATION=1 npm test` also verifies real filesystem write restrictions. Native subscription login/edit smoke tests are separate operator-run checks; automated CI does not spend model tokens.
