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
