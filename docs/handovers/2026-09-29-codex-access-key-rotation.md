# Handover — GUI access-key rotation

## Scope

Candidate 0.61.0 implements the first GUI administration slice without giving
the web gateway root, shell or arbitrary file authority.

## Behavior and boundary

- Settings offers a generated key or a strength-checked custom key.
- Preview requires the current key. Approval expires after five minutes, is bound
  to the browser session and exact replacement digest, asks for the current key
  again and requires confirmation that the replacement was saved.
- Generated plaintext is returned once. Server preview state retains only a hash;
  durable configuration stores only SHA-256.
- Success preserves the approving session and invalidates all other sessions.
  The runner audit contains neither key nor digest.
- A dedicated root helper accepts only `rotate-access-key` over
  `/run/agentd-admin/admin.sock`, verifies the current key, refuses links and
  unexpected ownership, and atomically replaces only `accessHash` with file and
  directory fsync.
- The gateway cannot access the helper socket. The helper has private networking,
  AF_UNIX only, and `/etc/agentd-web` as its sole writable host path.

## Deployment

Install the managed application archive first. Then run
`scripts/apply_administration.py --config /etc/agentd/update.json`. The migration
installs and verifies the helper unit and runner drop-in, records them in the
managed drift baseline and rolls back on failed acceptance. Its probe deliberately
uses an invalid key and must be refused; installation never rotates the live key.

## Validation

- Typecheck and formatting pass.
- Portable suite: 207 tests, 198 passed, 9 Linux-only skipped, 0 failed.
- Exact Ubuntu validation: 207/207 tests passed with zero skips, plus typecheck
  and formatting.
- Focused HTTPS coverage proves preview, rotation, old-key refusal, new-key
  acceptance, current-session preservation and other-session invalidation.
- Helper coverage proves wrong-key refusal, atomic digest-only update, mode
  preservation and symlink refusal.
- Runner coverage proves secrets and the replacement digest never enter audit.

The cumulative archive and launcher are staged but unexecuted. No live key was
rotated and no model task ran.

The exact validated release source is
`7096170a7d0b10ece9abc32fae1344b6dcdbef78`. The cumulative archive and
unexecuted launcher are staged in the private operator environment; their paths
and hashes are recorded only in the private operator handover. Draft PR #67 is
stacked on #66 and all required GitHub checks pass.

## Next item

Implement the read-only diagnostics bundle through the same boundary: a reviewed
allowlist of health, version, unit, storage and recent sanitized failures, without
raw journals, secrets or arbitrary commands.
