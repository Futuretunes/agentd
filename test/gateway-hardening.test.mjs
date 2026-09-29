import { test } from "node:test";
import { execFileSync } from "node:child_process";
test("gateway hardening: drop-in, verification, rollback and profile", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./gateway_hardening.py", import.meta.url).pathname],
    { stdio: "pipe" },
  );
});
