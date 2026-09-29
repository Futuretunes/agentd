# Handover — safe GUI diagnostics

## Scope

Candidate 0.62.0 implements the second GUI administration slice through the
fixed-purpose helper introduced for access-key rotation.

## Behavior and boundary

- Settings > Diagnostics shows installed version and revision, configuration
  drift/recovery status, fixed AgentD service states and restart counts, runner
  uptime, filesystem capacity and ten recent failed/interrupted runs.
- The downloadable JSON is the same normalized object shown by the interface.
- The helper invokes one fixed probe without browser parameters or a shell. The
  probe reads the managed deployment record, current managed inventory, fixed
  systemd properties and filesystem capacity.
- The helper still has private networking, AF_UNIX only and one writable host
  path for access-key rotation. It can read managed service configuration, while
  task state, worktrees and native account profiles remain inaccessible.
- The runner adds only task ID, status, update time and the existing sanitized
  public error. Prompts, titles, raw logs, journals, environment, config contents,
  credentials and private paths are excluded.
- Diagnostics are read-only, so an authenticated workspace session is enough.
  Administrative mutations continue to require exact preview and step-up.
- Managed updates now restart the configured administration helper so its loaded
  application code cannot remain on an older release after a successful swap.
- The explicit diagnostics migration replaces only the fixed helper unit, probes
  the no-argument operation and updates the managed inventory; failure restores
  the prior unit and deployment record.

## Validation

- Focused boundary/UI/runner/gateway suite: 37/37 passed.
- Portable suite: 211 tests, 202 passed, 9 Linux-only skipped, 0 failed.
- Typecheck, formatting and diff checks pass.
- Node 24, Node 26 and required Ubuntu isolation CI pass on the exact branch.
- The exact release archive and rollback-safe launcher are staged in the private
  operator environment but remain unexecuted. Installation itself runs candidate
  validation inside the production service boundary before swapping the app.

No model task or administrative mutation was submitted.

The exact release source is
`192d25bd56c2d41055db0be89852aebb990fdd08`. Draft PR #68 targets the
access-key candidate. Production was read-only verified on 0.61.0; candidate
0.62.0 is not installed. Private paths and artifact hashes are recorded only in
the VM operator handover.

## Next item

Implement reviewed in-app update planning and installation. Keep release
selection rooted in administrator-approved immutable artifacts; expose no archive
path or command parameter to the browser, bind approval to the exact plan, and
preserve drift, idle, backup, readiness and rollback safeguards.
