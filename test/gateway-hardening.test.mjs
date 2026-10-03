import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
test("gateway hardening: drop-in, verification, rollback and profile", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./gateway_hardening.py", import.meta.url))],
    { stdio: "pipe" },
  );
});
