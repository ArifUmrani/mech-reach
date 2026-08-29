import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../core/customer-auth/customer-auth.service';

@Component({
  selector: 'app-customer-account',
  imports: [RouterLink],
  templateUrl: './customer-account.html',
  styleUrl: './customer-account.scss',
})
export class CustomerAccount {
  private readonly auth = inject(CustomerAuthService);
  private readonly router = inject(Router);

  protected readonly session = this.auth.session;
  protected readonly maskedMobile = computed(() => this.auth.maskedMobile());

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/');
  }
}
