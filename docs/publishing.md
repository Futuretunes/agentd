# GitHub publishing and pull requests

After an edit has passed checks and received local commit approval, open **View committed changes → Publish to GitHub**. Connect GitHub through **Import from GitHub → GitHub connection** first, using an account with permission to push and create pull requests in the destination repository.

1. Choose the target base branch and enter the pull request title and description.
2. Choose **Prepare preview**. This reads GitHub and fetches the base; it does not upload work or create a pull request.
3. Review the destination, exact base and head commits, title, description, and every outgoing commit's patch. Expand each commit to read its changes.
4. Choose **Approve this preview: push and create draft PR** and confirm. The approved commit is uploaded to `agentd/<task-id>` and a draft pull request is created. Open the returned link to continue the review on GitHub.

The approval applies to the stored preview, not later edits to the form. Prepare a new preview to change the title, description or base. Previews expire after 15 minutes and on service restart; approval must come from the same authenticated browser session that prepared the preview.

## What is allowed

- The project's existing HTTPS `github.com/owner/repository` origin is the destination. Arbitrary hosts, SSH URLs, credential-bearing URLs and caller-supplied remotes are refused.
- The current remote base must be an ancestor of the approved local commit. A changed or diverged base requires updating and reviewing the work again; this release does not automatically rebase it.
- Every outgoing commit must have an agentd local commit approval and passing checks bound to its exact tree, in the same project. This includes earlier commits carried forward in the conversation.
- At most 20 outgoing commits and 180 KB of displayed patches are supported. Unrecorded merge commits, binary changes and common sensitive filenames anywhere in the outgoing history are refused. Removing a secret file in a later commit does not make its earlier history publishable. The filename guard is not a content secret scanner: inspect the patches yourself.
- An existing remote publishing branch is accepted only when it already points to the exact approved commit. New branches use an explicit empty-expected-value Git lease, so a concurrently created branch is not overwritten. Existing branches can advance only through the explicit draft-PR update flow below. No history rewrite, tag publishing, deletion, fork creation or automatic merge is offered.

Publishing may trigger repository GitHub Actions and subscriber notifications, even though the pull request is a draft. A passing local check does not establish test quality or that the proposed change is correct.

## Credentials and execution

The trusted daemon uses the existing native GitHub CLI profile. GitHub credentials never enter task workers or their worktrees. Git runs with repository hooks disabled, explicit commit/ref arguments, HTTPS-only transport, and without inherited user credential helpers or proxy environment variables. Pull request metadata is sent as JSON on stdin to a fixed GitHub API endpoint; titles and descriptions are not shell commands. Browser routes retain authentication, same-origin and CSRF protections; browser ownership is derived on the server.

Repository import/update, dependency preparation, GitHub account changes and publication are serialized. Worker isolation and provider networking policy are unchanged. GitHub network operations have bounded process timeouts and output sizes. Durable progress records precede remote writes; no publication automatically resumes after restart.

## Interrupted or uncertain outcomes

GitHub branch creation and pull request creation are separate operations. If the connection fails, **Check publication outcome** means the branch or PR may already exist; it is not a rollback claim. Prepare a fresh preview and approve again. The daemon rechecks the remote branch and looks for an existing matching PR before writing. A matching PR is reused, including a closed PR; its current title, description and state are kept. Conflicting work is never overwritten.

The remote base is rechecked before push and before PR creation. GitHub PRs reference mutable branches, so this cannot prevent a repository collaborator changing them during or after the operation. Unexpected response fields leave the operation requiring attention. Inspect the link on GitHub before merging. Rebasing onto an advanced base, fork workflows and PR review synchronization remain backlog items.

## Validation

Tests use temporary bare Git remotes and a simulated GitHub API to cover no writes before approval, exact commit and browser ownership binding, changed bases, branch races, history guards, uncertain outcomes and duplicate prevention. Native CLI transport tests verify fixed endpoints, literal JSON and clean credentials environment. The HTTPS gateway tests cover authentication and CSRF. No real repository is published by automated tests; the first live GUI publication requires the operator's explicit approval.

## Update an existing draft PR

After publishing, continue the same conversation, approve the next edit, run checks and approve its local commit. In **Publish to GitHub**, choose the existing PR from **Publication**, then prepare and review a new preview. The existing PR's base, title and description are read from its recorded destination/GitHub response; this flow updates commits only. The preview shows the previously approved head, the new head and all outgoing commit patches.

A fresh, browser-bound approval is required. Only a previously published PR in this conversation can be selected. It must still be open and a draft, and the new commit must extend the previously approved head. An explicit Git lease binds the update to that old head, so another person's intervening branch update is refused rather than overwritten. The daemon checks the PR again afterward and reports uncertain outcomes honestly. Retrying a completed upload verifies and reuses it without another push or creating a duplicate PR. PR state and base branches remain mutable on GitHub; changed state may require manual inspection after an upload.

## GitHub feedback and advanced bases

Use **View committed changes → GitHub feedback and conflicts** on the latest committed turn. [The guided workflow](github-feedback.md) imports selected feedback or prepares a separate integration review. Only integration merges recorded by agentd, reviewed against the fetched base and approved with passing exact-tree checks may be published. Both parent histories are retained, so an existing PR branch can advance without rewriting it.
