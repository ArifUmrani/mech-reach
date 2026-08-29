import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';

interface FooterLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly themeService = inject(ThemeService);

  protected readonly logoSrc = this.themeService.logoSrc;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly navLinks: readonly FooterLink[] = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  ];

  protected readonly serviceLinks: readonly FooterLink[] = [
    { id: 'emergency', label: 'Emergency Roadside Help', href: '#services' },
    { id: 'doorstep', label: 'Doorstep Services', href: '#doorstep-services' },
  ];

  protected readonly accountLinks: readonly FooterLink[] = [
    { id: 'become-a-mechanic', label: 'Become a Mechanic', href: '#become-a-mechanic' },
    { id: 'sign-in', label: 'Sign In', href: '#sign-in' },
  ];

  protected readonly legalLinks: readonly FooterLink[] = [
    { id: 'privacy', label: 'Privacy', href: '#privacy' },
    { id: 'terms', label: 'Terms', href: '#terms' },
  ];
}
