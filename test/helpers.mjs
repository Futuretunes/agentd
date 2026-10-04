import { setImmediate as yieldToEventLoop } from "node:timers/promises";

/** Wait for an observable condition rather than a guessed duration. The deadline is a
 * failure bound only; a passing test never depends on how long the wait took. */
export async function waitFor(condition, { timeoutMs = 20000, what = "condition" } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await condition();
    if (value) return value;
    if (Date.now() > deadline) throw Error(`Timed out waiting for ${what}`);
    await yieldToEventLoop();
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** A gate a test can open explicitly, used to hold background work at a known point. */
export function gate() {
  let open;
  const opened = new Promise((resolve) => (open = resolve));
  return { opened, open };
}
