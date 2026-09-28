# Contributing

Small, focused contributions are welcome. Open an issue to discuss substantial architecture or behavior changes before implementing them.

Run `npm ci --ignore-scripts`, `npm run typecheck` and `npm test` before opening a pull request. Explain the user-visible behavior and include regression coverage for changed queue, approval or security behavior. Tests must not require account credentials or live model calls.

Keep provider authentication in native CLIs. Do not add credentials, personal addresses, task logs or machine-specific network settings to fixtures. Preserve explicit approval before dispatch and keep process success distinct from task correctness.

Be respectful, describe problems concretely, and assume good intent. Maintainers may remove abusive or irrelevant contributions.

## Cross-agent handovers

Codex and Claude share [AGENTS.md](AGENTS.md) and [docs/handover.md](docs/handover.md). Read them before resuming work. After each work item, include a dated handover, validation evidence, remaining actions and an updated roadmap/status in the reviewed change. Claude discovers the same process through [CLAUDE.md](CLAUDE.md). Keep operator-only deployment details and all secrets out of public notes.
