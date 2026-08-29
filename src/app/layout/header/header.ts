import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';

interface HeaderNavLink {
  readonly id: string;
  readonly label: string;
  readonly routerLink: string;
  readonly fragment?: string;
}

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
  },
})
export class Header {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly logoSrc = this.themeService.logoSrc;
  protected readonly isDark = this.themeService.isDark;
  protected readonly themeToggleLabel = this.themeService.themeToggleLabel;
  protected readonly menuOpen = signal(false);
  protected readonly menuLabel = computed(() =>
    this.menuOpen() ? 'Close navigation menu' : 'Open navigation menu',
  );

  protected readonly navLinks: readonly HeaderNavLink[] = [
    { id: 'home', label: 'Home', routerLink: '/', fragment: 'home' },
    { id: 'services', label: 'Services', routerLink: '/', fragment: 'services' },
    { id: 'how-it-works', label: 'How It Works', routerLink: '/', fragment: 'how-it-works' },
    { id: 'become-a-mechanic', label: 'Become a Mechanic', routerLink: '/mechanic/join' },
    { id: 'sign-in', label: 'Sign In', routerLink: '/', fragment: 'sign-in' },
  ];

  constructor() {
    effect(() => {
      this.document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });

    afterNextRender(() => {
      const media = window.matchMedia('(min-width: 64rem)');
      media.addEventListener('change', (event) => {
        if (event.matches) {
          this.menuOpen.set(false);
        }
      });
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) {
      return;
    }

    this.menuOpen.set(false);

    if (restoreFocus) {
      this.menuButton()?.nativeElement.focus();
    }
  }

  protected onNavClick(): void {
    this.closeMenu();
  }

  protected onEscape(event: Event): void {
    if (!this.menuOpen()) {
      return;
    }

    event.preventDefault();
    this.closeMenu(true);
  }
}
