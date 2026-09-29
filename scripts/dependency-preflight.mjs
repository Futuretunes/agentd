import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import {
  checkManifest,
  writeManifests,
  prepareDependencies,
} from "../src/check-setup.ts";
import { isolated } from "../src/isolation.ts";
const root = mkdtempSync(join(tmpdir(), "agentd-dependency-preflight-")),
  source = join(root, "source"),
  stage = join(root, "stage"),
  repo = join(root, "repo");
let sandbox;
try {
  mkdirSync(source);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
  pkg.scripts = {
    preinstall: "touch INSTALL_SCRIPT_RAN",
    pretest: "touch PRETEST_RAN",
    test: "node -e \"require.resolve('typescript'); console.log('OFFLINE_CHECK_OK')\"",
  };
  writeFileSync(join(source, "package.json"), JSON.stringify(pkg));
  writeFileSync(
    join(source, "package-lock.json"),
    readFileSync(new URL("../package-lock.json", import.meta.url)),
  );
  writeManifests(stage, checkManifest(source));
  await prepareDependencies(stage, root, new AbortController().signal);
  if (existsSync(join(stage, "INSTALL_SCRIPT_RAN"))) throw Error("Install scripts ran");
  console.log(
    "dependencies: locked public packages downloaded in isolation; install scripts did not run",
  );
  mkdirSync(repo);
  for (const file of ["package.json", "package-lock.json"])
    writeFileSync(join(repo, file), readFileSync(join(source, file)));
  execFileSync("git", ["init", "-b", "main", repo], { stdio: "ignore" });
  execFileSync("git", ["-C", repo, "add", "package.json", "package-lock.json"]);
  execFileSync(
    "git",
    [
      "-C",
      repo,
      "-c",
      "user.name=fixture",
      "-c",
      "user.email=fixture@localhost",
      "commit",
      "-m",
      "fixture",
    ],
    { stdio: "ignore" },
  );
  sandbox = isolated(
    repo,
    root,
    process.execPath,
    [new URL("../src/check-worker.ts", import.meta.url).pathname],
    undefined,
    join(stage, "node_modules"),
  );
  await new Promise((resolve, reject) => {
    const p = spawn(sandbox.command, sandbox.args, {
      env: { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: process.env.HOME },
      stdio: "inherit",
    });
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(Error("Offline checks failed")),
    );
  });
  if (existsSync(join(repo, "PRETEST_RAN"))) throw Error("Pretest hook ran");
  console.log(
    "checks: downloaded dependencies available read-only; offline check passed without pre/post hooks",
  );
} finally {
  sandbox?.cleanup();
  rmSync(root, { recursive: true, force: true });
}
