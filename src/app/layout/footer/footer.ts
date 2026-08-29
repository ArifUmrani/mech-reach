import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../core/customer-auth/customer-auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface FooterLink {
  readonly id: string;
  readonly label: string;
  readonly routerLink: string;
  readonly fragment?: string;
  readonly queryParams?: Readonly<Record<string, string>>;
}

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly themeService = inject(ThemeService);
  private readonly auth = inject(CustomerAuthService);

  protected readonly logoSrc = this.themeService.logoSrc;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly navLinks: readonly FooterLink[] = [
    { id: 'home', label: 'Home', routerLink: '/', fragment: 'home' },
    { id: 'services', label: 'Services', routerLink: '/', fragment: 'services' },
    { id: 'how-it-works', label: 'How It Works', routerLink: '/', fragment: 'how-it-works' },
  ];

  protected readonly serviceLinks: readonly FooterLink[] = [
    { id: 'emergency', label: 'Emergency Roadside Help', routerLink: '/request', queryParams: { kind: 'roadside' } },
    { id: 'doorstep', label: 'Doorstep Services', routerLink: '/request', queryParams: { kind: 'doorstep' } },
  ];

  protected readonly accountLinks = computed((): readonly FooterLink[] => [
    { id: 'become-a-mechanic', label: 'Become a Mechanic', routerLink: '/mechanic/join' },
    this.auth.signedIn()
      ? { id: 'account', label: 'Account', routerLink: '/account' }
      : { id: 'sign-in', label: 'Sign In', routerLink: '/signin' },
  ]);

  protected readonly legalLinks: readonly FooterLink[] = [
    { id: 'privacy', label: 'Privacy', routerLink: '/', fragment: 'privacy' },
    { id: 'terms', label: 'Terms', routerLink: '/', fragment: 'terms' },
  ];
}
