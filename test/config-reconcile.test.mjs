import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
test("configuration fingerprints tolerate key rotation and reconcile only reviewed files", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./config_reconcile.py", import.meta.url))],
    {
      stdio: "pipe",
    },
  );
});
