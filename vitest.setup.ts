/**
 * Vitest global setup (next to `vitest.config.ts`).
 *
 * jsdom `localStorage` can be incomplete in some environments (e.g. missing `clear`).
 * In-memory Storage matches the browser API for code and libs.
 */
class MemoryStorage implements Storage {
  private readonly _map = new Map<string, string>();

  get length(): number {
    return this._map.size;
  }

  clear(): void {
    this._map.clear();
  }

  getItem(key: string): string | null {
    return this._map.get(String(key)) ?? null;
  }

  key(index: number): string | null {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= this._map.size) {
      return null;
    }
    return [...this._map.keys()][i] ?? null;
  }

  removeItem(key: string): void {
    this._map.delete(String(key));
  }

  setItem(key: string, value: string): void {
    this._map.set(String(key), String(value));
  }
}

function installStorage(name: "localStorage" | "sessionStorage"): void {
  try {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: new MemoryStorage(),
    });
  } catch {
    (globalThis as unknown as Record<string, Storage>)[name] = new MemoryStorage();
  }
}

installStorage("localStorage");
installStorage("sessionStorage");
