/** An in-process operation owns its slot through cancellation and cleanup.
 * Durable recovery remains the domain's responsibility; this is not a distributed lock.
 */
export function operationSlot(kind: string) {
  let closed = false;
  let current:
    | { id: string; token: symbol; abort: AbortController; done: Promise<void> }
    | undefined;
  const assertAvailable = () => {
    if (closed) throw Error("Operation manager is stopping.");
    if (current) throw Error("Another operation is in progress.");
  };
  return {
    assertAvailable,
    busy: () => !!current,
    view: () => (current ? Object.freeze({ kind, id: current.id }) : null),
    start(
      id: string,
      work: (signal: AbortSignal) => Promise<void>,
      settled: () => void = () => {},
    ) {
      assertAvailable();
      const abort = new AbortController(),
        token = Symbol(kind);
      const done = Promise.resolve()
        .then(() => work(abort.signal))
        .finally(() => {
          if (current?.token === token) current = undefined;
          settled();
        });
      current = { id, token, abort, done };
      // Domain failures must be recorded by work(). Unexpected persistence errors
      // are deliberately not suppressed: uncertain state must not look successful.
      return done;
    },
    cancel(id: string) {
      if (current?.id !== id) return false;
      current.abort.abort();
      return true;
    },
    async close() {
      closed = true;
      const pending = current;
      pending?.abort.abort();
      await pending?.done;
    },
  };
}
