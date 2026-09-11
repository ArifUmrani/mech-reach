import { inject, Service, signal } from '@angular/core';
import { MechanicAuthService } from '../mechanic-auth/mechanic-auth.service';
import { MechanicJoinDraft, UploadedFileRef } from '../mechanic-join/mechanic-join.model';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { MechanicApplicationRow } from './mechanic-application.model';

export type MechanicApplicationSubmitResult =
  | { readonly ok: true; readonly application: MechanicApplicationRow }
  | { readonly ok: false; readonly message: string };

type DocumentUploadResult =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly message: string };

const DOCUMENTS_BUCKET = 'mechanic-documents';

@Service()
export class MechanicApplicationService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly auth = inject(MechanicAuthService);
  private readonly applicationState = signal<MechanicApplicationRow | null>(null);

  readonly application = this.applicationState.asReadonly();

  /** Loads the mechanic's most recent application, if any. */
  async refresh(): Promise<void> {
    const userId = this.auth.userId();
    if (!this.client || !userId) {
      this.applicationState.set(null);
      return;
    }

    const { data, error } = await this.client
      .from('mechanic_applications')
      .select(
        'id, mechanic_id, full_name, email, photo_path, practice_kind, workshop_name, years_experience, vehicle_kind, service_ids, other_services, coverage_kind, city, service_areas, travel_km, available_days, hours_kind, available_from, available_to, identity_document_path, terms_accepted, status, created_at',
      )
      .eq('mechanic_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      this.applicationState.set(null);
      return;
    }

    this.applicationState.set(data[0] as MechanicApplicationRow);
  }

  async submitApplication(draft: MechanicJoinDraft): Promise<MechanicApplicationSubmitResult> {
    const userId = this.auth.userId();
    if (!this.client || !userId) {
      return { ok: false, message: 'Confirm your mobile number before sending this application.' };
    }

    const identityDocument = draft.identityDocument;
    if (
      !draft.practiceKind ||
      !draft.vehicleKind ||
      !draft.coverageKind ||
      !draft.hoursKind ||
      draft.serviceIds.length === 0 ||
      draft.availableDays.length === 0 ||
      !identityDocument ||
      !draft.termsAccepted
    ) {
      return { ok: false, message: 'This application is missing required details.' };
    }

    const identityUpload = await this.uploadDocument(userId, 'identity', identityDocument);
    if (!identityUpload.ok) {
      return { ok: false, message: identityUpload.message };
    }

    let photoPath: string | null = null;
    if (draft.photo) {
      const photoUpload = await this.uploadDocument(userId, 'photo', draft.photo);
      if (!photoUpload.ok) {
        return { ok: false, message: photoUpload.message };
      }
      photoPath = photoUpload.path;
    }

    const { data, error } = await this.client
      .from('mechanic_applications')
      .insert({
        full_name: draft.fullName.trim(),
        email: draft.email.trim(),
        photo_path: photoPath,
        practice_kind: draft.practiceKind,
        workshop_name: draft.workshopName.trim(),
        years_experience: Number(draft.yearsExperience) || 0,
        vehicle_kind: draft.vehicleKind,
        service_ids: draft.serviceIds,
        other_services: draft.otherServices.trim(),
        coverage_kind: draft.coverageKind,
        city: draft.city.trim(),
        service_areas: draft.serviceAreas.trim(),
        travel_km: Number(draft.travelKm) || 0,
        available_days: draft.availableDays,
        hours_kind: draft.hoursKind,
        available_from: draft.availableFrom || null,
        available_to: draft.availableTo || null,
        identity_document_path: identityUpload.path,
        terms_accepted: draft.termsAccepted,
      })
      .select(
        'id, mechanic_id, full_name, email, photo_path, practice_kind, workshop_name, years_experience, vehicle_kind, service_ids, other_services, coverage_kind, city, service_areas, travel_km, available_days, hours_kind, available_from, available_to, identity_document_path, terms_accepted, status, created_at',
      )
      .single();

    if (error || !data) {
      return { ok: false, message: 'Could not save this application. Try again.' };
    }

    const application = data as MechanicApplicationRow;
    this.applicationState.set(application);
    return { ok: true, application };
  }

  private async uploadDocument(
    userId: string,
    kind: 'photo' | 'identity',
    file: UploadedFileRef,
  ): Promise<DocumentUploadResult> {
    if (!this.client) {
      return { ok: false, message: 'Uploads are not configured yet.' };
    }

    const path = `${userId}/${kind}-${Date.now()}${extensionFor(file.type)}`;
    const { error } = await this.client.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file.raw, { contentType: file.type, upsert: false });

    if (error) {
      const label = kind === 'photo' ? 'photo' : 'identity document';
      return { ok: false, message: `Could not upload the ${label}. Try again.` };
    }

    return { ok: true, path };
  }
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
