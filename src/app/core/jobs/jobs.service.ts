import { inject, Service, signal } from '@angular/core';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import {
  CustomerRequestDraft,
  scheduledAtFromDraft,
  serviceTitle,
} from '../customer-request/customer-request.model';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { JobRow } from './jobs.model';

export type JobCreateResult =
  | { readonly ok: true; readonly job: JobRow }
  | { readonly ok: false; readonly message: string };

@Service()
export class JobService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly auth = inject(CustomerAuthService);
  private readonly itemsState = signal<readonly JobRow[]>([]);

  readonly items = this.itemsState.asReadonly();

  async refresh(): Promise<void> {
    const userId = this.auth.userId();
    if (!this.client || !userId) {
      this.itemsState.set([]);
      return;
    }

    const { data, error } = await this.client
      .from('jobs')
      .select(
        'id, reference, customer_id, help_kind, service_id, service_title, other_details, vehicle_kind, vehicle_detail, city, location_text, notes, scheduled_at, status, created_at',
      )
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      this.itemsState.set([]);
      return;
    }

    this.itemsState.set(data as JobRow[]);
  }

  async createFromDraft(draft: CustomerRequestDraft): Promise<JobCreateResult> {
    const userId = this.auth.userId();
    if (!this.client || !userId) {
      return { ok: false, message: 'Confirm your mobile number before sending this request.' };
    }

    if (
      (draft.helpKind !== 'roadside' && draft.helpKind !== 'doorstep') ||
      (draft.vehicleKind !== 'car' && draft.vehicleKind !== 'bike') ||
      !draft.serviceId ||
      !draft.city.trim()
    ) {
      return { ok: false, message: 'This request is missing required details.' };
    }

    const { data, error } = await this.client
      .from('jobs')
      .insert({
        help_kind: draft.helpKind,
        service_id: draft.serviceId,
        service_title: serviceTitle(draft.serviceId, draft.helpKind),
        other_details: draft.otherDetails.trim(),
        vehicle_kind: draft.vehicleKind,
        vehicle_detail: draft.vehicleDetail.trim(),
        city: draft.city.trim(),
        location_text: draft.location.trim(),
        notes: draft.notes.trim(),
        scheduled_at: scheduledAtFromDraft(draft),
      })
      .select(
        'id, reference, customer_id, help_kind, service_id, service_title, other_details, vehicle_kind, vehicle_detail, city, location_text, notes, scheduled_at, status, created_at',
      )
      .single();

    if (error || !data) {
      return { ok: false, message: 'Could not save this request. Try again.' };
    }

    const job = data as JobRow;
    this.itemsState.update((current) => [job, ...current.filter((item) => item.id !== job.id)]);
    return { ok: true, job };
  }
}
