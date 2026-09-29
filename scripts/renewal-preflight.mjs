// Authentication only; no prompts, tools or model requests. Run as the service user.
import { renewals } from "../src/renewal.ts";
import { readCredentials, workerCredentials } from "../src/credentials.ts";
import { homedir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import assert from "node:assert/strict";
if (!process.argv.includes("--live"))
  throw Error("Use --live to explicitly renew the native subscription sessions.");
const stateDir = mkdtempSync("/srv/agentd/tmp/renewal-preflight-");
const manager = renewals({ stateDir });
try {
  for (const id of ["claude", "codex"]) {
    await manager.ensure(id, true);
    const snapshot = workerCredentials(id, readCredentials(homedir(), id));
    assert.ok(
      id === "claude"
        ? !snapshot.claudeAiOauth.refreshToken
        : !snapshot.tokens.refresh_token,
    );
    console.log(
      id +
        ": native session renewed and saved; worker snapshot excludes the refresh grant",
    );
  }
} finally {
  await manager.close();
  rmSync(stateDir, { recursive: true, force: true });
}
