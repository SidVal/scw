export function createStorage(namespace = "santa-chat") {
  function get(key) {
    try {
      const raw = localStorage.getItem(`${namespace}:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(key, value) {
    localStorage.setItem(`${namespace}:${key}`, JSON.stringify(value));
  }

  function clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${namespace}:`))
      .forEach(k => localStorage.removeItem(k));
  }

  return { get, set, clear };
}
