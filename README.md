# agentd

Self-hosted orchestration for native coding agents, with a human in control.

agentd queues tasks, waits for approval, and runs Codex, Claude Code or Cursor in a dedicated Git worktree. A mobile-friendly task desk lets you submit text and images, approve work, cancel runs, and inspect results.

**Status: early proof of concept.** Linux is the deployment target. This is a single-user, trusted-network service, not a hardened multi-tenant platform. Ask mode is read-only. Optional Edit files mode requires Linux bubblewrap and separate run, check and commit approvals. A successful process exit does not prove that an agent fulfilled its task.

## Available today

- Scoped GUI permissions and model/effort choices for projects, conversations and individual agents, with visible inheritance and fresh approval when pending settings change.

- Codex, Claude Code and Cursor adapters using their installed CLIs and existing account logins; agentd does not require provider API keys.
- Approval-gated GitHub publishing with exact commit previews, dedicated branches, draft pull requests and approved forward updates to existing draft PRs.
- GUI npm dependency setup with explicit approval, isolated public-registry downloads and install scripts disabled.
- Revision requests that preserve uncommitted edits, with fresh run and check approvals.
- Reviewable edits, snapshot-bound test results and explicitly approved local branch commits.
- GitHub repository import, branch selection, guided private-repository sign-in and safe forward-only updates.
- Projects with local repositories, persistent conversations, rename and archive controls.
- Durable SQLite queue, explicit approval, one active worker, timeouts and process-group cancellation.
- Commit-pinned, detached Git worktrees for each task.
- HTTPS mobile interface with access-key login, text input, JPEG/PNG attachments and follow-up tasks.
- Keyboard dictation through your phone's operating system. Recorded audio and transcription are not implemented.
- Local health and Prometheus metrics endpoints; structured daemon logs.
- Read-only Operations Center for global task, service, adapter and account status.

Use each provider's supported authentication and respect its subscription terms and limits. agentd does not bypass billing, permissions or rate limits. Cursor uses the official CLI browser login and ACP for text-based Ask/Edit with file-only permissions. See [Cursor setup and limits](docs/cursor.md).

## Development

Requires Node.js 24 or newer, Git and OpenSSL. Production uses Node's built-in SQLite and TypeScript support, with no runtime npm dependencies.

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
```

Tests use fake child processes and temporary repositories. They do not authenticate or submit paid model work.

To run the health service alone:

```sh
AGENTD_STATE_DIR="$PWD/.runtime" npm start
curl http://127.0.0.1:8787/healthz
```

For an actual task runner, install and authenticate the desired native CLIs as the service user first. Point `AGENTD_REPO` to a local Git repository with at least one commit:

```sh
export AGENTD_STATE_DIR="$PWD/.runtime"
export AGENTD_CONTROL_SOCKET="$AGENTD_STATE_DIR/control.sock"
export AGENTD_REPO=/absolute/path/to/your/repository
export AGENTD_RUNNER=1
# Optional: override the defaults ~/.local/bin/codex and ~/.local/bin/claude
export AGENTD_CODEX_BIN=/absolute/path/to/codex
export AGENTD_CLAUDE_BIN=/absolute/path/to/claude
npm start
```

In another terminal, set the same `AGENTD_CONTROL_SOCKET`, then:

```sh
npm run agentctl -- create codex 'Read README.md and summarize it.'
npm run agentctl -- list
npm run agentctl -- approve TASK_ID
npm run agentctl -- show TASK_ID
npm run agentctl -- cancel TASK_ID
```

Every newly created task waits for approval. Follow-ups create separate tasks; they do not inject instructions into a running session.

Use **＋** beside Projects to create an empty project or choose **Import from GitHub**, paste a repository URL, find branches and import one. Use **GitHub connection** for private repositories. Imported projects offer **Pull updates** in Project details; start a new conversation to use the updated revision. See [GitHub repositories](docs/repositories.md). Existing repositories can be registered by an administrator with `npm run agentctl -- project-register "Project name" /absolute/repository/path`. Registration is available only through the private control socket, not the browser. GitHub publication alone does not register a repository.

See [deployment](docs/deployment.md), [architecture](docs/architecture.md), [security](SECURITY.md), [roadmap](docs/roadmap.md) and [contributing](CONTRIBUTING.md).

## Reviewable editing

See [editing setup and limitations](docs/editing.md). Editing is disabled by default. No changes are pushed or published automatically. After committing reviewed edits, choose **Publish to GitHub**, prepare a preview, then explicitly approve the branch upload and draft pull request. See [publishing](docs/publishing.md).

## Hardened workers

The [hardened worker profile](docs/worker-security.md) isolates Ask and Edit tasks, limits outbound connections to selected provider destinations, and records approval decisions. The initial hardened deployment enables Claude only: Codex remains disabled where its inner sandbox cannot run under the host's namespace restrictions. No sandbox bypass is used. Since v0.10.0, the optional [Codex Chat only](docs/codex-chat.md) mode enables text Q&A in an empty sandbox while repository modes stay disabled.

Open **Agents** in the task desk to see which native agents are available and why others are unavailable. Installation discovery does not verify account login. See the [adapter contract](docs/adapters.md) for extension and security requirements.

Optional [durable native credential renewal](docs/credential-renewal.md) refreshes sessions before approved work and keeps refresh grants outside task workers. Operations explains when provider consent requires a GUI reconnect.

[Workspace history and recovery](docs/workspace-history.md) provides search, reversible archives, run activity and browser-tab draft recovery.

GitHub reviews: [selected comment import and safe conflict handling](docs/github-feedback.md).

Use **Agent settings** for inherited access profiles, native model/effort choices and next-run overrides. See [environment permissions](docs/environment-permissions.md) and [model selection](docs/model-selection.md). Existing installations retain Provider default until you choose Auto or a specific model.
