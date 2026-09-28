# 2026-09-28 — Session attribution and missing mutation audits

- Author: Codex; authorized overnight backlog R19.
- Branch: `feat/session-audit` from `fix/bounded-review-output` at `bd4e39d`.
- Release: cumulative 0.28.0, task schema 1. Includes R6/R7/R12/R13, binary classification and R15.
- Status: implemented; focused regressions passed, exact Linux/CI pending. Not installed.

## Changes

`gateway-protocol.ts` requires owner hashes for browser mutations. `mobile.ts` overwrites any supplied owner with the authenticated cookie's hash. Runner dispatch differentiates the private administrative socket from the browser socket and scopes attribution with AsyncLocalStorage, including asynchronous work initiated by that request. Audit actor data contains `kind` and a domain-separated hash of the browser owner, never the session cookie or reusable owner token. Local operations cannot claim browser identity merely by adding an owner input.

Project creation/registration, project rename, conversation rename and discard now record minimal IDs transactionally with their database mutation. Task creation is audited in its existing transaction. Existing approval/check/settings/publication records inherit request attribution. Names, prompts and credential material are not newly added to audit payloads. Existing actor strings become structured actor objects; historical rows remain unchanged.

## Validation

Focused gateway/mobile/runner and new session tests verify owner-spoof rejection, distinct session pseudonyms, private-local attribution, approval/discard/rename/create entries, failed rename rollback and absence of prompts/names/token/path details. Exact Linux/CI pending. No production/model/account/publication changes.

## Limitations and next

A session pseudonym identifies a browser session, not a named person. The shared access key still authorizes all its holders. A compromised gateway remains able to claim an arbitrary pseudonym; this is traceability, not stronger authentication. Historical audits are not rewritten, and existing event names may represent requested or completed stages rather than universal success receipts. External tamper-evident storage and a GUI audit viewer are not implemented.

Finalize exact checks, then stage one cumulative administrator launcher and keep independently actionable backlog work moving. Installed 0.22.0 remains unchanged. Managed update and explicit resource profile transition are the only installation steps; no audit/schema migration or new consent is needed.
