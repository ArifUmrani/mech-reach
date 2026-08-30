import { HelpKind, RequestVehicleKind } from '../customer-request/customer-request.model';

export type JobStatus = 'requested';

export interface JobRow {
  readonly id: string;
  readonly reference: string;
  readonly customer_id: string;
  readonly help_kind: HelpKind;
  readonly service_id: string;
  readonly service_title: string;
  readonly other_details: string;
  readonly vehicle_kind: RequestVehicleKind;
  readonly vehicle_detail: string;
  readonly city: string;
  readonly location_text: string;
  readonly notes: string;
  readonly scheduled_at: string | null;
  readonly status: JobStatus;
  readonly created_at: string;
}

export function jobWhenLabel(job: JobRow): string {
  if (job.help_kind !== 'doorstep' || !job.scheduled_at) {
    return 'As soon as possible';
  }

  return formatJobTimestamp(job.scheduled_at);
}

export function formatJobTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
