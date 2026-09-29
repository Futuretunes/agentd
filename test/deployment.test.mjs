import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("service preserves complete procfs for bubblewrap without granting host capabilities", () => {
  const unit = readFileSync(new URL("../deploy/agentd.service", import.meta.url), "utf8");
  assert.match(unit, /^User=agentd$/m);
  assert.match(unit, /^NoNewPrivileges=true$/m);
  assert.match(unit, /^ProtectKernelTunables=false$/m);
  assert.match(unit, /^CapabilityBoundingSet=$/m);
  assert.doesNotMatch(unit, /^AmbientCapabilities=/m);
  assert.match(unit, /^RestrictAddressFamilies=.*AF_NETLINK/m);
});

test("administration helper has one fixed entry point and no network or broad host access", () => {
  const unit = readFileSync(
    new URL("../deploy/agentd-admin.service", import.meta.url),
    "utf8",
  );
  assert.match(unit, /^User=root$/m);
  assert.match(unit, /^Group=agentd$/m);
  assert.match(unit, /^ExecStart=.*\/src\/admin-helper\.ts$/m);
  assert.match(unit, /^NoNewPrivileges=true$/m);
  assert.match(unit, /^ProtectSystem=strict$/m);
  assert.match(unit, /^ReadWritePaths=\/etc\/agentd-web$/m);
  assert.match(unit, /^RestrictAddressFamilies=AF_UNIX$/m);
  assert.match(unit, /^PrivateNetwork=true$/m);
  assert.match(unit, /^CapabilityBoundingSet=CAP_CHOWN$/m);
  assert.doesNotMatch(unit, /AF_INET|AF_NETLINK|\/bin\/(?:ba)?sh/);
});
