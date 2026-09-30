# 2026-09-30 — 0.148.0: Polite live attached images region (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attachment chip list changes must announce politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.148.0
- Branch and base: `feat/gui-attachments-live` on `main` (0.147.0)
- Implementation commit(s): 6fa23c0
- PR: #237

## Changes and relevant files

- `#attachments` sets `aria-live="polite"` while keeping `aria-label="Attached images"`.
- Package 0.148.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #237; live-installed on 192.168.1.20 (0.148.0 / 6fa23c0).
- Archive SHA-256: `74b237a12bb6d49e6d944e3ddbc7ba6a2f1f548fe1eaaf79ea2813169a62559a`
- Revision: `6fa23c08bfb5aa7dfe524f8633a8da8194489f32`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.147.0 / revert of #237.

## Constraints and known issues

- Complements Remove attachment chip names from 0.126.0.

## Next steps

1. Done: merged #237 and live-installed 0.148.0.
2. Continue UX polish or admin slices as operator priority allows.
