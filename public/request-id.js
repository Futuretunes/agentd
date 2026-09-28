// A staged request survives a lost HTTP response and a refresh in this tab.
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export function stageCreation(
  storage,
  key,
  payload,
  confirmNew = () => false,
  newId = () => crypto.randomUUID(),
) {
  const encoded = JSON.stringify(canonical(payload));
  let saved;
  try {
    saved = JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    throw Error(
      "The pending request could not be read. Check History before retrying in another browser.",
    );
  }
  if (
    saved &&
    (typeof saved.id !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        saved.id,
      ) ||
      typeof saved.payload !== "string")
  )
    throw Error(
      "The pending request is invalid. Check History before starting new work.",
    );
  if (saved && saved.payload !== encoded && !confirmNew())
    throw Error(
      "The earlier send may already have completed. Retry it unchanged or check History before starting different work.",
    );
  const id = saved?.payload === encoded ? saved.id : newId();
  try {
    storage.setItem(key, JSON.stringify({ id, payload: encoded }));
    const stored = JSON.parse(storage.getItem(key));
    if (stored.id !== id || stored.payload !== encoded) throw Error();
  } catch {
    throw Error(
      "This browser cannot save a pending request. Allow tab storage before sending.",
    );
  }
  return { ...payload, requestId: id };
}
export function completeCreation(storage, key, id) {
  try {
    const value = JSON.parse(storage.getItem(key) ?? "null");
    if (value?.id === id) storage.removeItem(key);
  } catch {}
}
