import {
  CoverageKind,
  HoursKind,
  PracticeKind,
  VehicleKind,
  WeekdayId,
} from '../mechanic-join/mechanic-join.model';

export type MechanicApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface MechanicApplicationRow {
  readonly id: string;
  readonly mechanic_id: string;
  readonly full_name: string;
  readonly email: string;
  readonly photo_path: string | null;
  readonly practice_kind: PracticeKind;
  readonly workshop_name: string;
  readonly years_experience: number;
  readonly vehicle_kind: VehicleKind;
  readonly service_ids: readonly string[];
  readonly other_services: string;
  readonly coverage_kind: CoverageKind;
  readonly city: string;
  readonly service_areas: string;
  readonly travel_km: number;
  readonly available_days: readonly WeekdayId[];
  readonly hours_kind: HoursKind;
  readonly available_from: string | null;
  readonly available_to: string | null;
  readonly identity_document_path: string;
  readonly terms_accepted: boolean;
  readonly status: MechanicApplicationStatus;
  readonly created_at: string;
}
