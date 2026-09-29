import { test } from "node:test";
import { execFileSync } from "node:child_process";
test("resource migration and backup retention preserve recovery boundaries", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./resource_deployment.py", import.meta.url).pathname],
    { stdio: "pipe" },
  );
});
