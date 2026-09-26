# Security

This early POC is intended for one trusted operator on a private network. Do not expose the gateway directly to the public internet.

Run under a dedicated account without sudo. Treat prompts, repository files, attachments and agent output as untrusted content. Git worktrees are not a security boundary. All workers currently share the service account's files and native CLI authentication.

The mobile gateway uses TLS, hashed access keys, in-memory sessions, same-origin POST checks and login throttling. Restarting it invalidates sessions. Uploaded images have size and signature checks, but are not fully decoded or sanitized. Task logs can contain sensitive data. Protect and back up the state directory accordingly.

Do not commit credentials, login caches, private keys, access keys, task databases or real user logs. The repository contains no installation-specific credentials or TLS material.

The daemon only checks process exit status. Review outputs before trusting results. Write-capable agents, internet exposure and multiple users require further security design.

For vulnerabilities, use the hosting platform's private vulnerability reporting feature if enabled. Do not publish secrets or exploit details in a public issue. A dedicated reporting contact and supported-release policy will be established before a stable release.
