import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly isAdminArea = signal(this.isAdminUrl(this.router.url));

  constructor() {
    inject(ThemeService);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isAdminArea.set(this.isAdminUrl(event.urlAfterRedirects));
      }
    });
  }

  private isAdminUrl(url: string): boolean {
    return url === '/admin' || url.startsWith('/admin/');
  }
}
