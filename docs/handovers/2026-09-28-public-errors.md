# 2026-09-28 — Browser-safe errors

- Author: Codex; overnight backlog R18.
- Branch: `fix/public-error-boundary` from `feat/native-limit-status` at `6604faa`.
- Release: cumulative 0.30.0, task schema 1. Not installed; production remains 0.22.0.

## Changes

`src/public-errors.ts` is a fail-closed public error boundary. Only reviewed complete fixed messages and a bounded exit-code form pass through. Selected system codes map to fixed guidance; all other errors become a generic recovery message. `public-error-messages.ts` contains fixed source literals, not regular-expression prefix allowances, dynamic interpolation or captured subprocess text. `scripts/public_errors.py` refreshes this catalog for explicit review; it does not run automatically at startup/build. Future user-facing messages must be deliberately added/reviewed.

Both the runner's separate gateway socket and HTTPS response boundary apply normalization. Recursive error/settings_error fields and serialized check metadata are normalized too, covering old stored failures. The underlying task database is not rewritten. Private administrative socket behavior, authored prompts/answers and authorized logs/output are unchanged. This does not claim general content scrubbing or conceal intentionally returned project metadata.

## Validation

Seven focused tests passed, including raw gateway and HTTPS exception injection with fake private paths/secret text, unknown stored errors, known-message preservation, nested check metadata and malformed-check handling. Typecheck passed. Exact Linux/CI pending. No model/account/production or remote publication actions.

## Limitations and next

Unknown dynamic messages now give generic guidance; improve them by introducing reviewed fixed messages, never by allowing arbitrary prefixes. Internal administrative diagnostics remain privileged; no new raw-error logging was added. Logs and user content can still contain sensitive data and are outside this exception boundary. Keep authorization and secret handling independent of message normalization.

Complete exact Linux/CI and draft review, then R16 explicit follow-up context. Stage one cumulative managed update plus resource profile transition; no R18-specific migration. Do not replace the private control socket with the browser socket for administrator tools.
