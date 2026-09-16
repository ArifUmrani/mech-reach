import { Component } from '@angular/core';
import { AdminPlaceholder } from '../admin-placeholder/admin-placeholder';

@Component({
  selector: 'app-admin-jobs',
  imports: [AdminPlaceholder],
  template: `
    <app-admin-placeholder
      title="Jobs"
      message="Job management is not available yet."
      headingId="admin-jobs-heading"
    />
  `,
})
export class AdminJobs {}
