import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../core/customer-auth/customer-auth.service';
import { formatJobTimestamp, jobWhenLabel } from '../../core/jobs/jobs.model';
import { JobService } from '../../core/jobs/jobs.service';
import { helpKindLabel, vehicleLabel } from '../../core/customer-request/customer-request.model';

@Component({
  selector: 'app-customer-account',
  imports: [RouterLink],
  templateUrl: './customer-account.html',
  styleUrl: './customer-account.scss',
})
export class CustomerAccount {
  private readonly auth = inject(CustomerAuthService);
  private readonly jobs = inject(JobService);
  private readonly router = inject(Router);

  protected readonly session = this.auth.session;
  protected readonly requests = computed(() =>
    this.jobs.items().map((item) => ({
      ...item,
      kindLine: helpKindLabel(item.help_kind),
      vehicleLine: item.vehicle_detail
        ? `${vehicleLabel(item.vehicle_kind)} · ${item.vehicle_detail}`
        : vehicleLabel(item.vehicle_kind),
      whenLabel: jobWhenLabel(item),
      placedLabel: formatJobTimestamp(item.created_at),
    })),
  );
  protected readonly maskedMobile = computed(() => this.auth.maskedMobile());

  constructor() {
    effect(() => {
      if (this.auth.signedIn()) {
        void this.jobs.refresh();
      }
    });
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    void this.router.navigateByUrl('/');
  }
}
