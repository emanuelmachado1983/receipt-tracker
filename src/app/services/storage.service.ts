import { Injectable } from '@angular/core';

/**
 * Versioned localStorage abstraction. Bump the prefix (rt_v1_ -> rt_v2_) when the
 * stored shape changes, and add a migration step here rather than in the callers.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'rt_v1_';

  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}
