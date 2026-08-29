import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { THEME_LOGOS, THEME_STORAGE_KEY, Theme } from './theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly hasManualPreference = signal(this.readStoredTheme() !== null);

  readonly theme = signal<Theme>(this.resolveInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');
  readonly logoSrc = computed(() => THEME_LOGOS[this.theme()]);
  readonly themeToggleLabel = computed(() =>
    this.isDark() ? 'Switch to light theme' : 'Switch to dark theme',
  );

  constructor() {
    this.applyToDocument(this.theme());
    this.listenToSystemTheme();
  }

  toggle(): void {
    this.select(this.theme() === 'dark' ? 'light' : 'dark');
  }

  select(theme: Theme): void {
    this.hasManualPreference.set(true);
    this.persist(theme);
    this.theme.set(theme);
    this.applyToDocument(theme);
  }

  private resolveInitialTheme(): Theme {
    const stored = this.readStoredTheme();
    if (stored) {
      return stored;
    }

    const current = this.document.documentElement.getAttribute('data-theme');
    if (current === 'light' || current === 'dark') {
      return current;
    }

    return this.getSystemTheme();
  }

  private getSystemTheme(): Theme {
    const media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    return media?.matches ? 'dark' : 'light';
  }

  private applyToDocument(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document.documentElement.style.colorScheme = theme;
  }

  private persist(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage can be unavailable in private or restricted contexts.
    }
  }

  private readStoredTheme(): Theme | null {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private listenToSystemTheme(): void {
    const media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    media?.addEventListener('change', (event) => {
      if (!this.hasManualPreference()) {
        const next: Theme = event.matches ? 'dark' : 'light';
        this.theme.set(next);
        this.applyToDocument(next);
      }
    });
  }
}
