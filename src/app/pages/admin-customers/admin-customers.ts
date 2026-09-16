import { Component } from '@angular/core';
import { AdminPlaceholder } from '../admin-placeholder/admin-placeholder';

@Component({
  selector: 'app-admin-customers',
  imports: [AdminPlaceholder],
  template: `
    <app-admin-placeholder
      title="Customers"
      message="Customer management is not available yet."
      headingId="admin-customers-heading"
    />
  `,
})
export class AdminCustomers {}
