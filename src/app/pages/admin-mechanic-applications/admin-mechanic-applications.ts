import { Component, computed, inject, signal } from '@angular/core';
import {
  AdminMechanicApplicationRow,
  applicantMobile,
} from '../../core/admin-mechanic-applications/admin-mechanic-applications.model';
import { AdminMechanicApplicationsService } from '../../core/admin-mechanic-applications/admin-mechanic-applications.service';
import { MechanicApplicationStatus } from '../../core/mechanic-application/mechanic-application.model';
import { daysSummary, hoursSummary } from '../../core/mechanic-join/availability';
import {
  ChoiceOption,
  COVERAGE_OPTIONS,
  OTHER_SERVICE_ID,
  OTHER_SERVICE_TITLE,
  PRACTICE_OPTIONS,
  VEHICLE_OPTIONS,
} from '../../core/mechanic-join/mechanic-join.model';
import { SERVICE_CATEGORIES } from '../landing/landing.content';

type StatusFilter = MechanicApplicationStatus | 'all';

const STATUS_FILTERS: readonly { readonly id: StatusFilter; readonly label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

@Component({
  selector: 'app-admin-mechanic-applications',
  templateUrl: './admin-mechanic-applications.html',
  styleUrl: './admin-mechanic-applications.scss',
})
export class AdminMechanicApplications {
  private readonly applications = inject(AdminMechanicApplicationsService);

  protected readonly loading = this.applications.loading;
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly statusFilter = signal<StatusFilter>('pending');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly confirmingRejectId = signal<string | null>(null);
  protected readonly actingOnId = signal<string | null>(null);
  protected readonly actionError = signal('');
  protected readonly documentError = signal('');
  protected readonly openingDocumentKey = signal<string | null>(null);

  protected readonly counts = computed(() => {
    const items = this.applications.items();
    return {
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
      all: items.length,
    };
  });

  protected readonly filteredItems = computed(() => {
    const filter = this.statusFilter();
    const items = this.applications.items();
    return filter === 'all' ? items : items.filter((item) => item.status === filter);
  });

  constructor() {
    void this.applications.refresh();
  }

  protected setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  protected countFor(filter: StatusFilter): number {
    return this.counts()[filter];
  }

  protected toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
    this.confirmingRejectId.set(null);
  }

  protected mobileOf(row: AdminMechanicApplicationRow): string {
    return applicantMobile(row) || 'Not available';
  }

  protected practiceLabel(row: AdminMechanicApplicationRow): string {
    return this.labelFor(PRACTICE_OPTIONS, row.practice_kind);
  }

  protected vehicleLabel(row: AdminMechanicApplicationRow): string {
    return this.labelFor(VEHICLE_OPTIONS, row.vehicle_kind);
  }

  protected coverageLabel(row: AdminMechanicApplicationRow): string {
    return this.labelFor(COVERAGE_OPTIONS, row.coverage_kind);
  }

  protected serviceTitles(row: AdminMechanicApplicationRow): readonly string[] {
    return row.service_ids.map((id) => this.serviceTitle(id));
  }

  protected daysLabel(row: AdminMechanicApplicationRow): string {
    return daysSummary(row.available_days) || 'Not set';
  }

  protected hoursLabel(row: AdminMechanicApplicationRow): string {
    return hoursSummary(row.hours_kind, row.available_from ?? '', row.available_to ?? '') || 'Not set';
  }

  protected submittedLabel(row: AdminMechanicApplicationRow): string {
    const date = new Date(row.created_at);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  protected askRejectConfirmation(id: string): void {
    this.confirmingRejectId.set(id);
  }

  protected cancelRejectConfirmation(): void {
    this.confirmingRejectId.set(null);
  }

  protected async approve(id: string): Promise<void> {
    await this.review(id, () => this.applications.approve(id));
  }

  protected async confirmReject(id: string): Promise<void> {
    this.confirmingRejectId.set(null);
    await this.review(id, () => this.applications.reject(id));
  }

  protected async viewDocument(row: AdminMechanicApplicationRow, kind: 'identity' | 'photo'): Promise<void> {
    const path = kind === 'identity' ? row.identity_document_path : row.photo_path;
    if (!path) {
      return;
    }

    const key = this.documentKey(row.id, kind);
    this.documentError.set('');
    this.openingDocumentKey.set(key);

    // Open the tab synchronously, inside the click handler, so browsers do
    // not treat it as a blocked popup once we navigate it after the async
    // signed-URL request below resolves.
    const tab = window.open('', '_blank');
    const url = await this.applications.documentUrl(path);
    this.openingDocumentKey.set(null);

    if (!url) {
      tab?.close();
      this.documentError.set('Could not open this document. Try again.');
      return;
    }

    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  protected isActingOn(id: string): boolean {
    return this.actingOnId() === id;
  }

  protected isOpeningDocument(id: string, kind: 'identity' | 'photo'): boolean {
    return this.openingDocumentKey() === this.documentKey(id, kind);
  }

  private documentKey(id: string, kind: 'identity' | 'photo'): string {
    return `${id}:${kind}`;
  }

  private async review(id: string, action: () => Promise<{ ok: boolean; message?: string }>): Promise<void> {
    this.actingOnId.set(id);
    this.actionError.set('');
    const result = await action();
    this.actingOnId.set(null);

    if (!result.ok) {
      this.actionError.set(result.message ?? 'Could not update this application. Try again.');
    }
  }

  private serviceTitle(id: string): string {
    if (id === OTHER_SERVICE_ID) {
      return OTHER_SERVICE_TITLE;
    }
    for (const category of SERVICE_CATEGORIES) {
      const match = category.services.find((service) => service.id === id);
      if (match) {
        return match.title;
      }
    }
    return id;
  }

  private labelFor<T extends string>(options: readonly ChoiceOption<T>[], value: T): string {
    return options.find((option) => option.value === value)?.title ?? value;
  }
}
