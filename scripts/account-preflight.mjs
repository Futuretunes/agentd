// Native login startup only. No authorization code is entered and no account is changed.
import { accounts } from "../src/accounts.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const owner = "a".repeat(64),
  root = mkdtempSync(join(tmpdir(), "agentd-login-preflight-"));
const manager = accounts({
  root: join(root, "sessions"),
  home: root,
  timeoutMs: 30000,
  changed: () => {},
});
try {
  for (const id of process.argv.includes("--cursor-only")
    ? ["cursor"]
    : ["claude", "codex"]) {
    const session = manager.start(owner, id, "login");
    let ready = false;
    for (let i = 0; i < 150; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const state = manager.view(owner);
      if (
        state.url &&
        (id === "cursor" ? true : id === "claude" ? state.needsCode : !!state.code)
      ) {
        ready = true;
        break;
      }
      if (["failed", "expired"].includes(state.state)) break;
    }
    manager.cancel(owner, session.id);
    for (let i = 0; i < 100 && manager.busy(); i++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    if (!ready || manager.busy())
      throw Error(
        id +
          ": native login startup could not be verified; existing credentials were not changed.",
      );
    console.log(
      id + ": native login prompt recognized and cancelled in an empty temporary profile",
    );
  }
} finally {
  await manager.close();
  rmSync(root, { recursive: true, force: true });
}
