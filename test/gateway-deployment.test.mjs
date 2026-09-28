import { test } from "node:test";
import { execFileSync } from "node:child_process";
test("gateway identity migration records a verified profile and rolls back failed acceptance", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./gateway_deployment.py", import.meta.url).pathname],
    { stdio: "pipe" },
  );
});
