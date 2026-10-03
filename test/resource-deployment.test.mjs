import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
test("resource migration and backup retention preserve recovery boundaries", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./resource_deployment.py", import.meta.url))],
    { stdio: "pipe" },
  );
});
