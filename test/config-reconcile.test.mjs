import { test } from "node:test";
import { execFileSync } from "node:child_process";
test("configuration fingerprints tolerate key rotation and reconcile only reviewed files", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./config_reconcile.py", import.meta.url).pathname],
    {
      stdio: "pipe",
    },
  );
});
