# GitHub projects

Use **＋** beside Projects → **Import from GitHub**. Paste an HTTPS GitHub repository URL, select **Find branches**, choose a branch and project name, then **Import project**. Open the finished project to start an approval-gated conversation. Public repositories need no GitHub account.

For private repositories, open **GitHub connection → Connect GitHub**. The native GitHub CLI displays a one-time device code. Open GitHub, enter the code, and review the provider's requested permissions. GitHub CLI's standard OAuth flow may request broader permissions than read-only repository access; agentd currently only uses the connection for discovery, clone and fetch. Organization SSO or access restrictions can require additional action on GitHub. No token entry is offered in agentd.

**Pull updates**, under Project details, fetches the imported branch and advances only a clean local checkout that is an ancestor of the remote. It refuses local modifications, branch/remote changes, divergent or ahead commits, pending approvals, active work and unresolved edit reviews. It never resets, rebases, force-overwrites or pushes. Existing conversations/worktrees stay pinned; new conversations use the updated checkout. Cancellation is honored before applying files; an in-progress final Git merge finishes before the job completes.

Operations run in the background, one at a time, with progress, cancel and stored outcomes in the import dialog. A failed or cancelled import removes its partial directory. Restart marks unfinished jobs interrupted and removes unregistered partial imports. Previously registered projects are never removed. Duplicate URL/branch imports are rejected, including archived projects (restore these from History). Different branches can be separate projects.

## Current limits

- github.com HTTPS only, with no credentials, ports, query parameters, alternate hosts, SSH or local paths in URLs.
- One branch, up to 100 commits at import, no tags; 120 seconds per Git command, 512 MB / 100,000 files per repository checked during and after transfer. These are application limits rather than OS disk quotas; brief transfer overshoot is possible. Long-history updates that cannot establish ancestry are refused.
- Empty repositories and unusual branch names outside the supported safe subset cannot be imported.
- Submodules, LFS downloads, dependency installs, hooks and repository setup scripts are not run. LFS pointer files may remain.
- Imported projects can be inspected and edited through supported agents. Use Set up checks in Project details or an edit review for supported public npm projects. Other dependency/check profiles still need administrative setup. Importing does not silently approve dependency installation or test execution.
- Connecting uses the service account's GitHub identity. Multi-user authorization, selecting among multiple GitHub accounts, push and pull requests remain future work.
- Native login startup has been verified without consent. End-to-end private import still needs the operator to connect their GitHub account and select a repository.

## Boundary and deployment

Git runs as the unprivileged service user, outside task workers, with a fresh HOME and a fixed environment. Global/system Git config, inherited askpass/token/proxy overrides, hooks, filesystem monitor and automatic maintenance are disabled. Only HTTPS transport is enabled. The canonical GitHub hostname is resolved to public addresses and pinned for Git's connection, redirects are disabled and TLS verification remains enabled. Repository-supplied code is not executed. This is not a separate Git parser sandbox; it relies on the maintained system Git binary and service hardening.

GitHub credentials are kept in the native CLI profile at `~/.agentd-github/profile`, private to the service account (directory 0700, files 0600). Linux uses a local credential file when no keyring is available. Task sandboxes never mount this profile. Native login output is discarded; only normalized state and a one-time code are returned to its authenticated initiating browser. Existing credentials survive failed/cancelled sign-in. Disconnect removes the local profile; revoke the application's grant on GitHub to remove authorization elsewhere.

The pinned native GitHub CLI lives at `/usr/local/bin/gh`. The prepared POC installer uses the official v2.101.0 Linux amd64 binary verified against the release checksum, without changing worker policy. Other architectures require their matching official build. Service restarts kill children through the systemd control group. Application/task rollbacks must not restore credential directories.

Validation: `npm run typecheck`, `npm test`, and on Linux `AGENTD_TEST_ISOLATION=1 npm test`. `node scripts/repository-preflight.mjs` contacts GitHub, clones the public agentd repository into a disposable directory, recognizes/cancels a device login prompt in an empty profile, and submits no model request or account consent.
