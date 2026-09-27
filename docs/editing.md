# Reviewable editing

Choose **Ask** for read-only questions, or **Edit files** to request changes. Every turn requires run approval. After an edit, choose **Review changes**, inspect the diff, run checks, and explicitly approve a commit. Commits create an `agentd/<task-id>` branch. The project's checked-out branch is not changed. Nothing is pushed and no pull request is created by this release.

The next conversation turn starts from the preceding approved commit. Resolve the previous review before continuing. Discarding a review retains its worktree for inspection but does not carry those edits forward. Asking the agent to revise an uncommitted change set is not yet supported.

## Enable on Linux

Install bubblewrap through the distribution package manager and ensure unprivileged user namespaces work under the service account and systemd restrictions. Set `AGENTD_EDITING=1` in the daemon's environment and restart it. `AGENTD_BWRAP_BIN` may override `/usr/bin/bwrap`. There is no production fallback that runs edits without this sandbox.

The outer sandbox mounts host files read-only, gives the worker a writable worktree and temporary home, hides daemon state/control sockets, protects Git metadata, and uses a separate PID namespace. The installed native CLI code is read-only. CLI auth files are copied internally to the disposable home, never returned by the control API. The temporary profile is removed when work finishes; startup removes leftovers from interrupted workers. Native CLIs still need their own provider network access. This is not a multi-tenant security boundary or an egress firewall.

Codex uses `workspace-write`; Claude uses an explicit Read/Glob/Grep/Edit/Write tool list and `dontAsk`. There is no blanket permission bypass. See [Codex CLI reference](https://developers.openai.com/codex/cli/reference) and [Claude CLI reference](https://code.claude.com/docs/en/cli-reference).

## Configure checks

The first check profile supports npm projects. An administrator prepares the repository's dependencies with `npm ci --ignore-scripts`, then registers that `node_modules` directory through the private control socket:

```sh
sudo -H -u agentd /usr/local/bin/agentctl project-checks PROJECT_ID /absolute/path/to/node_modules
```

The directory must remain readable by the service. Registration records the current repository's `package-lock.json` hash. Check runs reject changed lockfiles until an administrator prepares and registers matching dependencies. This release does not install packages from agent-controlled instructions.

Checks run `npm run typecheck --if-present`, followed by `npm test`, in a separate bubblewrap sandbox with no network or provider credentials. Dependencies are mounted read-only. The UI displays actual output and status. Missing scripts, unavailable dependencies, and unsupported check profiles fail rather than being represented as success. Do not configure packages that need lifecycle scripts without separately reviewing and preparing them.

## Review binding

A temporary Git index captures tracked changes, new files and deletions into a tree object. Attachment input files are excluded. Both test results and commit approval refer to that exact tree. Changed content invalidates previous checks and approval. Changes made by the check commands themselves also invalidate the check result.

Large diffs, binary changes and common sensitive filenames require local resolution and cannot be committed through the interface. This filename guard is not a secret scanner. Read the diff before approving.

Commit creation uses Git plumbing with hooks disabled, and creates a new branch without changing the project checkout. Failed/cancelled edit runs can still be inspected; only an exact snapshot with passing checks can be committed. The snapshot includes all reviewable file changes, not just changes the agent mentioned in its response.

## Validation

`npm test` exercises review behavior using deterministic workers. On a Linux machine with bubblewrap, `AGENTD_TEST_ISOLATION=1 npm test` also verifies real filesystem write restrictions. Native subscription login/edit smoke tests are separate operator-run checks; automated CI does not spend model tokens.
