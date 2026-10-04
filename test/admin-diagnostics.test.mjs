import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

test("diagnostic probe returns only bounded normalized deployment facts", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./admin_diagnostics.py", import.meta.url))],
    { stdio: "pipe" },
  );
});
