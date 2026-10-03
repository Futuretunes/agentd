import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

test("administration migrations wait for their fixed helper socket", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./administration_migration.py", import.meta.url))],
    { stdio: "pipe" },
  );
});
