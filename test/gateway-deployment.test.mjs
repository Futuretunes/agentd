import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
test("gateway identity migration records a verified profile and rolls back failed acceptance", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./gateway_deployment.py", import.meta.url))],
    { stdio: "pipe" },
  );
});
