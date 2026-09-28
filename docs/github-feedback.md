# GitHub feedback and safe base integration

Open the latest committed turn, then **View committed changes → GitHub feedback and conflicts**. Connect GitHub first. These operations use the trusted GitHub connection; agents never receive its credentials.

## Import selected feedback

Choose a previously published PR from this conversation and **Load review comments**. The preview includes inline comments, review summaries and PR discussion comments. Select the entries to address, add your own instruction, then **Create feedback request**. The new turn waits for **Approve & run**, and any resulting edits need their usual checks, commit approval and publication approval.

Comment bodies are displayed as literal text and passed as untrusted reference material. Imported feedback does not authorize commands, permission changes or publication. Nothing is replied to or resolved on GitHub. Old line/commit references are shown as context, not assumed to match the current local files. The PR's repository, branch, base and last recorded published head must match; unexpected external head changes are refused.

Each category is limited to 150 entries, with at most 250 KB of normalized comment text overall. Partial lists are labeled. Individual bodies longer than 8,000 characters are truncated and cannot be selected; a request accepts at most 30 comments within the normal 16,000-character prompt budget. Choose fewer comments when necessary. Selection defaults to none.

## Integrate an advanced base

Enter the target branch and **Preview base integration**. The daemon fetches that branch and computes a merged tree without changing the project checkout, old worktrees or published branch. Inspect the diff and conflict list before choosing **Create integration review**. That action creates a separate isolated worktree and pending edit review; it does not run a model or publish anything.

For conflicts, select **Request revisions**, explain how the versions should be combined, and approve the new agent run. Conflict markers block checks and commit approval. Once resolved, inspect the complete diff against the fetched base, run fresh checks and approve the local commit. The commit retains the new base and previous approved head as its two parents. **Publish to GitHub → Publication** can then prepare a separately approved forward update to the existing draft PR. No rebase or published-history rewrite is performed. A base that changes again requires another preview/integration.

Only ordinary text conflicts are supported initially. Binary, symlink, delete/rename conflicts, custom external merge drivers, oversized changes, sensitive filenames, shallow/unrelated histories and externally changed publication branches fail safely with the existing work preserved. A conflict-free Git merge or absence of markers does not prove semantic correctness; human review and meaningful checks remain necessary. Local administrators can resolve unsupported cases outside this guided workflow; workers receive no additional privileges.

## Persistence and approval boundaries

Previews belong to the authenticated browser that prepared them, expire after 30 minutes and expire on restart. Apply requests use the stored preview and exact fingerprint; client-supplied trees or repository paths are not accepted. Repeated identical apply requests return the same resulting task, including after restart. A different selection requires a new preview from the latest committed turn. Imported snapshot bodies are retained in local task state; audit records contain identifiers/fingerprints, not comment bodies.

Integration trees are retained under internal Git refs. Existing snapshots and worktrees are preserved; automated storage retention remains on the backlog. Checks and commit approval carry the recorded integration parents through revision requests and retries. Publishing accepts only these recorded, approved merges, and retains its remote-head lease and fresh-base checks.

This is an on-demand import, not a background GitHub synchronizer. Posting replies, resolving threads, merging PRs, forks and broader conflict types remain separate work. Tests use disposable local remotes and fixed API fixtures, never live PR comments or publications.
