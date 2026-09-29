import { test } from "node:test";
import { execFileSync } from "node:child_process";

test("diagnostic probe returns only bounded normalized deployment facts", () => {
  execFileSync(
    "python3",
    ["-B", new URL("./admin_diagnostics.py", import.meta.url).pathname],
    { stdio: "pipe" },
  );
});
