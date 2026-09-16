import { MechanicApplicationRow } from '../mechanic-application/mechanic-application.model';

export interface AdminMechanicApplicationRow extends MechanicApplicationRow {
  /** Embedded from `profiles` via the `mechanic_id` foreign key. */
  readonly profiles: { readonly mobile_e164: string } | null;
}

export type AdminReviewResult =
  | { readonly ok: true; readonly application: MechanicApplicationRow }
  | { readonly ok: false; readonly message: string };

export function applicantMobile(row: AdminMechanicApplicationRow): string {
  return row.profiles?.mobile_e164 ?? '';
}
