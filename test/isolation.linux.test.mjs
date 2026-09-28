import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { isolated } from "../src/isolation.ts";
import { git } from "../src/changes.ts";
test(
  "Linux sandbox allows worktree writes and denies Git metadata writes",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "isolate-")),
      repo = join(root, "repo"),
      tree = join(root, "tree"),
      state = join(root, "state");
    mkdirSync(repo);
    mkdirSync(state);
    git(repo, ["init", "-b", "main"]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ]);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    const secret = join(state, "hidden-secret");
    writeFileSync(secret, "sentinel");
    const config = join(repo, ".git/config"),
      before = readFileSync(config, "utf8");
    const script = `import pathlib\np=pathlib.Path('allowed.txt');p.write_text('allowed')\nfor name in ['.git',${JSON.stringify(config)}]:\n try:\n  open(name,'a').write('forbidden')\n except OSError:\n  pass\n else:\n  raise RuntimeError('Git metadata was writable')\nimport socket\nassert not pathlib.Path(${JSON.stringify(secret)}).exists()\nassert not pathlib.Path(${JSON.stringify(join(repo, "unrelated"))}).exists()\ns=socket.socket();s.settimeout(0.2)\nassert s.connect_ex(('192.168.1.1',443)) != 0\nprint('ISOLATION_OK')`;
    let sandbox;
    try {
      sandbox = isolated(tree, state, "/usr/bin/python3", ["-c", script]);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 10000 }),
        /ISOLATION_OK/,
      );
      assert.equal(readFileSync(join(tree, "allowed.txt"), "utf8"), "allowed");
      assert.equal(readFileSync(config, "utf8"), before);
      sandbox.cleanup();
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        ["-c", "from pathlib import Path; Path('denied.txt').write_text('bad')"],
        undefined,
        undefined,
        false,
      );
      assert.throws(() =>
        execFileSync(sandbox.command, sandbox.args, { stdio: "pipe", timeout: 10000 }),
      );
    } finally {
      sandbox?.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test(
  "isolated worker reaches only the selected provider proxy and cleans up",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "relay-")),
      repo = join(root, "repo"),
      tree = join(root, "tree"),
      state = join(root, "state");
    mkdirSync(repo);
    mkdirSync(state);
    git(repo, ["init", "-b", "main"]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ]);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    const script = `import os,socket,urllib.parse\np=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])\ns=socket.create_connection((p.hostname,p.port),timeout=5)\ns.sendall(b'CONNECT example.com:443 HTTP/1.1\\r\\n\\r\\n')\nassert b'403 Forbidden' in s.recv(1000)\nprint('RELAY_OK')`;
    let sandbox;
    try {
      sandbox = isolated(tree, state, "/usr/bin/python3", ["-c", script], "claude");
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /RELAY_OK/,
      );
    } finally {
      sandbox?.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test(
  "chat isolation hides repository files, Git metadata and project hooks",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "chat-isolate-")),
      tree = join(root, "tree"),
      state = join(root, "state");
    mkdirSync(tree);
    mkdirSync(state);
    writeFileSync(join(tree, "SECRET"), "repository secret");
    writeFileSync(join(tree, "AGENTS.md"), "untrusted project instructions");
    const script = `import pathlib,socket,os,urllib.parse\nassert list(pathlib.Path('.').iterdir())==[]\nassert not pathlib.Path(${JSON.stringify(join(tree, "SECRET"))}).exists()\nassert not pathlib.Path(${JSON.stringify(state)}).exists()\ntry:\n pathlib.Path('written').write_text('bad')\nexcept OSError:\n pass\nelse:\n raise RuntimeError('chat workspace writable')\np=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])\ns=socket.create_connection((p.hostname,p.port),timeout=5)\ns.sendall(b'CONNECT example.com:443 HTTP/1.1\\r\\n\\r\\n')\nassert b'403 Forbidden' in s.recv(1000)\nprint('CHAT_ISOLATION_OK')`;
    // args[1] is the mounted native executable in the real wrapper invocation.
    const check = join(root, "check.py"),
      alias = join(root, "native-alias");
    writeFileSync(check, script);
    symlinkSync("/usr/bin/python3", alias);
    let sandbox;
    try {
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        [check, alias],
        "codex",
        undefined,
        false,
        true,
      );
      assert.ok(!sandbox.args.includes(alias));
      assert.ok(sandbox.args.includes(realpathSync(alias)));
      // Add only the trusted test script; no repo or daemon state mount.
      sandbox.args.splice(sandbox.args.indexOf("--"), 0, "--ro-bind", check, check);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /CHAT_ISOLATION_OK/,
      );
      assert.equal(readFileSync(join(tree, "SECRET"), "utf8"), "repository secret");
    } finally {
      sandbox?.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test(
  "trusted renewal persists its profile while hiding repositories and daemon state",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "renew-isolate-")),
      tree = join(root, "tree"),
      state = join(root, "state"),
      profile = join(root, "profile");
    for (const p of [tree, state, profile]) mkdirSync(p);
    writeFileSync(join(tree, "SECRET"), "hidden");
    writeFileSync(join(state, "SECRET"), "hidden");
    writeFileSync(join(profile, "grant"), "synthetic");
    const script = `import pathlib,os\nhome=pathlib.Path(os.environ['HOME'])\nassert (home/'grant').read_text()=='synthetic'\n(home/'grant').write_text('rotated')\nassert list(pathlib.Path('.').iterdir())==[]\nassert not pathlib.Path(${JSON.stringify(join(tree, "SECRET"))}).exists()\nassert not pathlib.Path(${JSON.stringify(state)}).exists()\nprint('TRUSTED_RENEWAL_OK')`;
    const check = join(root, "check.py");
    writeFileSync(check, script);
    let sandbox;
    try {
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        [check, "/usr/bin/python3"],
        "claude",
        undefined,
        false,
        false,
        { renewalHome: profile },
      );
      sandbox.args.splice(sandbox.args.indexOf("--"), 0, "--ro-bind", check, check);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /TRUSTED_RENEWAL_OK/,
      );
      sandbox.cleanup();
      sandbox = undefined;
      assert.equal(readFileSync(join(profile, "grant"), "utf8"), "rotated");
      // A normal worker sees neither the durable profile nor its parent state directory.
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        [check, "/usr/bin/python3"],
        "codex",
        undefined,
        false,
        true,
      );
      writeFileSync(
        check,
        `import pathlib\nassert not pathlib.Path(${JSON.stringify(profile)}).exists()\nprint('WORKER_SEPARATION_OK')`,
      );
      sandbox.args.splice(sandbox.args.indexOf("--"), 0, "--ro-bind", check, check);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /WORKER_SEPARATION_OK/,
      );
    } finally {
      sandbox?.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test(
  "access-only worker receives no refresh grant and cannot change durable credentials",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const prior = process.env.HOME,
      root = mkdtempSync(join(tmpdir(), "access-only-")),
      home = join(root, "home"),
      repo = join(root, "repo"),
      tree = join(root, "tree"),
      state = join(root, "state");
    for (const p of [home, repo, state]) mkdirSync(p);
    git(repo, ["init", "-b", "main"]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ]);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    mkdirSync(join(home, ".claude"));
    mkdirSync(join(home, ".agentd-renewal"));
    const file = join(home, ".claude/.credentials.json"),
      original = JSON.stringify({
        claudeAiOauth: {
          accessToken: "synthetic-access",
          refreshToken: "synthetic-grant",
          expiresAt: Date.now() + 3600000,
        },
      });
    writeFileSync(file, original);
    process.env.HOME = home;
    let sandbox;
    try {
      const script = `import os,json,pathlib\np=pathlib.Path(os.environ['HOME'])\nv=json.loads((p/'.claude/.credentials.json').read_text())\nassert 'refreshToken' not in v['claudeAiOauth']\nassert os.environ['CLAUDE_CODE_OAUTH_TOKEN']=='synthetic-access'\nassert not (p/'.agentd-renewal').exists()\n(p/'.claude/.credentials.json').write_text('worker-controlled')\nprint('ACCESS_ONLY_OK')`;
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        ["-c", script],
        "claude",
        undefined,
        false,
        false,
        { accessOnly: true },
      );
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /ACCESS_ONLY_OK/,
      );
      assert.equal(readFileSync(file, "utf8"), original);
    } finally {
      sandbox?.cleanup();
      if (prior === undefined) delete process.env.HOME;
      else process.env.HOME = prior;
      rmSync(root, { recursive: true, force: true });
    }
  },
);
test(
  "Cursor isolation masks hooks and other accounts, strips refresh grants and keeps Git and network boundaries",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "cursor-isolate-")),
      repo = join(root, "repo"),
      tree = join(root, "tree"),
      state = join(root, "state"),
      home = join(root, "home"),
      prior = process.env.HOME;
    let sandbox;
    for (const dir of [repo, state, home]) mkdirSync(dir);
    git(repo, ["init", "-b", "main"]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ]);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    for (const dir of [".cursor", ".claude", "nested/.cursor"]) {
      mkdirSync(join(tree, dir), { recursive: true });
      writeFileSync(join(tree, dir, "hooks.json"), "UNTRUSTED_HOOK");
    }
    writeFileSync(join(tree, ".mcp.json"), "UNTRUSTED_MCP");
    mkdirSync(join(home, ".config/cursor"), { recursive: true });
    writeFileSync(
      join(home, ".config/cursor/auth.json"),
      JSON.stringify({
        accessToken: "fixture-access-only",
        refreshToken: "NEVER_VISIBLE_REFRESH",
      }),
    );
    mkdirSync(join(home, ".codex"));
    writeFileSync(join(home, ".codex/auth.json"), "OTHER_ACCOUNT");
    process.env.HOME = home;
    const script = `import pathlib,json,os,socket,urllib.parse\nh=pathlib.Path(os.environ['HOME'])\nassert json.loads((h/'.config/cursor/auth.json').read_text())=={'accessToken':'fixture-access-only'}\nassert os.environ['CURSOR_AUTH_TOKEN']=='fixture-access-only'\nassert not (h/'.codex/auth.json').exists()\nfor p in ['.cursor','.claude','nested/.cursor']:\n assert list(pathlib.Path(p).iterdir())==[]\nassert pathlib.Path('.mcp.json').read_text()=='{}'\nfor p in ['.cursor/hooks.json','.cursor/managed/hook.sh','.claude/hook']:\n try:\n  (h/p).write_text('BAD')\n except OSError:\n  pass\n else:\n  raise RuntimeError('hook writable')\nassert os.environ['DIRENV_DISABLE']=='1'\nassert os.environ['GIT_CONFIG_VALUE_0']=='/dev/null'\npathlib.Path('safe.txt').write_text('OK')\ntry:\n pathlib.Path('.git').write_text('BAD')\nexcept OSError:\n pass\nelse:\n raise RuntimeError('git writable')\np=urllib.parse.urlparse(os.environ['HTTPS_PROXY']);s=socket.create_connection((p.hostname,p.port),timeout=5);s.sendall(b'CONNECT api.openai.com:443 HTTP/1.1\\r\\n\\r\\n');assert b'403 Forbidden' in s.recv(1000)\nprint('CURSOR_ISOLATION_OK')`;
    const check = join(root, "check.py");
    writeFileSync(check, script);
    try {
      sandbox = isolated(
        tree,
        state,
        "/usr/bin/python3",
        [check, "/usr/bin/python3"],
        "cursor",
        undefined,
        true,
        false,
        { accessOnly: true },
      );
      sandbox.args.splice(sandbox.args.indexOf("--"), 0, "--ro-bind", check, check);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /CURSOR_ISOLATION_OK/,
      );
      assert.equal(readFileSync(join(tree, "safe.txt"), "utf8"), "OK");
      assert.equal(
        readFileSync(join(tree, ".cursor/hooks.json"), "utf8"),
        "UNTRUSTED_HOOK",
      );
    } finally {
      sandbox?.cleanup();
      if (prior === undefined) delete process.env.HOME;
      else process.env.HOME = prior;
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test(
  "worker drops capabilities, denies namespace/syscall escapes and retains ordinary threads",
  { skip: process.env.AGENTD_TEST_ISOLATION !== "1" },
  () => {
    const root = mkdtempSync(join(tmpdir(), "hardening-")),
      repo = join(root, "repo"),
      tree = join(root, "tree"),
      state = join(root, "state");
    mkdirSync(repo);
    mkdirSync(state);
    git(repo, ["init", "-b", "main"]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=t@example.invalid",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ]);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    let sandbox;
    const script = `import ctypes,errno,pathlib,threading,os,socket\nc=ctypes.CDLL(None,use_errno=True)\ns=dict(line.split(':',1) for line in pathlib.Path('/proc/self/status').read_text().splitlines() if ':' in line)\nassert int(s['CapEff'].strip(),16)==0\nassert int(s['CapBnd'].strip(),16)==0\nassert s['Seccomp'].strip()=='2'\nassert s['NoNewPrivs'].strip()=='1'\nassert socket.gethostname()=='agentd-worker'\nassert c.unshare(0x10000000)==-1 and ctypes.get_errno()==errno.EPERM\nassert c.setns(-1,0)==-1 and ctypes.get_errno()==errno.EPERM\nassert c.ptrace(0,0,0,0)==-1 and ctypes.get_errno()==errno.EPERM\nassert c.mount(None,None,None,0,None)==-1 and ctypes.get_errno()==errno.EPERM\nt=threading.Thread(target=lambda:pathlib.Path('thread-ok').write_text('ok'));t.start();t.join()\npid=os.fork()\nif pid==0:os._exit(0)\nassert os.waitpid(pid,0)[1]==0\nprint('HARDENING_OK')`;
    try {
      sandbox = isolated(tree, state, "/usr/bin/python3", ["-c", script]);
      assert.match(
        execFileSync(sandbox.command, sandbox.args, { encoding: "utf8", timeout: 15000 }),
        /HARDENING_OK/,
      );
      assert.equal(readFileSync(join(tree, "thread-ok"), "utf8"), "ok");
    } finally {
      sandbox?.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
