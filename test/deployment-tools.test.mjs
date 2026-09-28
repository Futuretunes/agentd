import test from "node:test";
import { execFileSync } from "node:child_process";
test("release and updater fixtures: reproducibility, tampering, schema, drift and rollback", () => {
  execFileSync("python3", ["-B", "test/deployment_tools.py"], {
    stdio: "pipe",
  });
});
