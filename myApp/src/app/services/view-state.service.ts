import { Injectable } from '@angular/core';
import { deleteBrowserData } from './browser-data.store';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  read<T>(key: string, fallback: T): T {
    try {
      const saved = sessionStorage.getItem(key);
      return saved === null ? fallback : JSON.parse(saved) as T;
    } catch {
      return fallback;
    }
  }

  write(key: string, value: unknown) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Larger media drafts are stored in IndexedDB by the composer.
    }
  }

  clear(key: string) {
    try { sessionStorage.removeItem(key); } catch { /* Storage can be disabled by the browser. */ }
  }

  handleTabTap(path: string, stateKey: string) {
    try {
      const tapKey = 'tali-tab-tap';
      const now = Date.now();
      const previous = JSON.parse(sessionStorage.getItem(tapKey) ?? 'null') as { path?: string; time?: number } | null;
      const currentPath = location.pathname.replace(/\/$/, '') || '/';
      sessionStorage.setItem(tapKey, JSON.stringify({ path, time: now }));
      if (currentPath !== path || previous?.path !== path || now - (previous.time ?? 0) > 450) return;

      sessionStorage.removeItem(tapKey);
      sessionStorage.removeItem(stateKey);
      // Remove stale query state (for example an open notification modal) so
      // reselecting a tab starts that page from its default view.
      history.replaceState(history.state, '', location.pathname);
      void deleteBrowserData(stateKey).finally(() => location.reload());
    } catch {
      // Keep navigation working even in restricted storage environments.
    }
  }
}
