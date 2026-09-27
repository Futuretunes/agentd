# agentd

Self-hosted orchestration for native coding agents, with a human in control.

agentd queues tasks, waits for approval, and runs Codex or Claude Code in a dedicated Git worktree. A mobile-friendly task desk lets you submit text and images, approve work, cancel runs, and inspect results.

**Status: early proof of concept.** Linux is the deployment target. This is a single-user, trusted-network service, not a hardened multi-tenant platform. The current adapters are configured for read-only work. A successful process exit does not prove that an agent fulfilled its task.

## Available today

- Codex and Claude Code adapters using their installed CLIs and existing account logins; agentd does not require provider API keys.
- Projects with local repositories, persistent conversations, rename and archive controls.
- Durable SQLite queue, explicit approval, one active worker, timeouts and process-group cancellation.
- Commit-pinned, detached Git worktrees for each task.
- HTTPS mobile interface with access-key login, text input, JPEG/PNG attachments and follow-up tasks.
- Keyboard dictation through your phone's operating system. Recorded audio and transcription are not implemented.
- Local health and Prometheus metrics endpoints; structured daemon logs.

Use each provider's supported authentication and respect its subscription terms and limits. agentd does not bypass billing, permissions or rate limits. Cursor and other adapters are planned, not implemented.

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

Use **＋** beside Projects to create an empty project, then **New conversation** to start work. Existing repositories can be registered by an administrator with `npm run agentctl -- project-register "Project name" /absolute/repository/path`. Registration is available only through the private control socket, not the browser. GitHub publication alone does not register a repository.

See [deployment](docs/deployment.md), [architecture](docs/architecture.md), [security](SECURITY.md), [roadmap](docs/roadmap.md) and [contributing](CONTRIBUTING.md).
