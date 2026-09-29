import { test } from "node:test";
import { execFileSync } from "node:child_process";

test("administration migrations wait for their fixed helper socket", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./administration_migration.py", import.meta.url).pathname],
    { stdio: "pipe" },
  );
});
