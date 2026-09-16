import { inject, Service, signal } from '@angular/core';
import { MechanicApplicationRow } from '../mechanic-application/mechanic-application.model';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { AdminMechanicApplicationRow, AdminReviewResult } from './admin-mechanic-applications.model';

const DOCUMENTS_BUCKET = 'mechanic-documents';
const SIGNED_URL_TTL_SECONDS = 300;

@Service()
export class AdminMechanicApplicationsService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly itemsState = signal<readonly AdminMechanicApplicationRow[]>([]);
  private readonly loadingState = signal(false);

  readonly items = this.itemsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  /** Loads every mechanic application, most recently submitted first. */
  async refresh(): Promise<void> {
    if (!this.client) {
      this.itemsState.set([]);
      return;
    }

    this.loadingState.set(true);
    const { data, error } = await this.client
      .from('mechanic_applications')
      .select(
        'id, mechanic_id, full_name, email, photo_path, practice_kind, workshop_name, years_experience, vehicle_kind, service_ids, other_services, coverage_kind, city, service_areas, travel_km, available_days, hours_kind, available_from, available_to, identity_document_path, terms_accepted, status, created_at, profiles(mobile_e164)',
      )
      .order('created_at', { ascending: false });
    this.loadingState.set(false);

    if (error || !data) {
      this.itemsState.set([]);
      return;
    }

    this.itemsState.set(data as unknown as AdminMechanicApplicationRow[]);
  }

  async approve(id: string): Promise<AdminReviewResult> {
    return this.setStatus(id, 'approved');
  }

  async reject(id: string): Promise<AdminReviewResult> {
    return this.setStatus(id, 'rejected');
  }

  /** Signed URL to view a private document (identity document or photo). */
  async documentUrl(path: string | null): Promise<string | null> {
    if (!this.client || !path) {
      return null;
    }

    const { data, error } = await this.client.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    return error || !data ? null : data.signedUrl;
  }

  private async setStatus(
    id: string,
    status: 'approved' | 'rejected',
  ): Promise<AdminReviewResult> {
    if (!this.client) {
      return { ok: false, message: 'Admin review is not configured yet.' };
    }

    const { data, error } = await this.client
      .from('mechanic_applications')
      .update({ status })
      .eq('id', id)
      .select(
        'id, mechanic_id, full_name, email, photo_path, practice_kind, workshop_name, years_experience, vehicle_kind, service_ids, other_services, coverage_kind, city, service_areas, travel_km, available_days, hours_kind, available_from, available_to, identity_document_path, terms_accepted, status, created_at',
      )
      .single();

    if (error || !data) {
      return { ok: false, message: 'Could not update this application. Try again.' };
    }

    const application = data as MechanicApplicationRow;
    this.itemsState.update((current) =>
      current.map((item) => (item.id === id ? { ...item, status: application.status } : item)),
    );
    return { ok: true, application };
  }
}
