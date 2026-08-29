import { isValidMobile, normalizeMobile } from '../mechanic-join/mobile';
import {
  CustomerRequestDraft,
  HelpKind,
  RequestVehicleKind,
  helpKindLabel,
  scheduleSummary,
  serviceTitle,
  vehicleLabel,
} from './customer-request.model';

export const CUSTOMER_REQUEST_HISTORY_STORAGE_KEY = 'mechreach-customer-requests';

export interface CustomerRequestSnapshot {
  readonly reference: string;
  readonly mobile: string;
  readonly helpKind: HelpKind;
  readonly serviceTitle: string;
  readonly vehicleKind: RequestVehicleKind;
  readonly vehicleDetail: string;
  readonly city: string;
  readonly whenLabel: string;
  readonly submittedAt: string;
}

export function snapshotFromDraft(
  draft: CustomerRequestDraft,
  submittedAt = new Date().toISOString(),
): CustomerRequestSnapshot | null {
  if (draft.helpKind !== 'roadside' && draft.helpKind !== 'doorstep') {
    return null;
  }

  if (draft.vehicleKind !== 'car' && draft.vehicleKind !== 'bike') {
    return null;
  }

  if (!draft.reference.trim() || !draft.serviceId || !isValidMobile(draft.mobile)) {
    return null;
  }

  const city = draft.city.trim();
  if (!city) {
    return null;
  }

  return {
    reference: draft.reference.trim(),
    mobile: normalizeMobile(draft.mobile),
    helpKind: draft.helpKind,
    serviceTitle: serviceTitle(draft.serviceId, draft.helpKind),
    vehicleKind: draft.vehicleKind,
    vehicleDetail: draft.vehicleDetail.trim(),
    city,
    whenLabel: scheduleSummary(
      draft.helpKind,
      draft.scheduleWhen,
      draft.scheduleDate,
      draft.scheduleTime,
    ),
    submittedAt,
  };
}

export function parseCustomerRequestHistory(raw: string | null): CustomerRequestSnapshot[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      const snapshot = parseSnapshot(item);
      return snapshot ? [snapshot] : [];
    });
  } catch {
    return [];
  }
}

export function requestVehicleLine(item: CustomerRequestSnapshot): string {
  const kind = vehicleLabel(item.vehicleKind);
  return item.vehicleDetail ? `${kind} · ${item.vehicleDetail}` : kind;
}

export function requestKindLine(item: CustomerRequestSnapshot): string {
  return helpKindLabel(item.helpKind);
}

export function formatSubmittedAt(isoDate: string): string {
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

function parseSnapshot(value: unknown): CustomerRequestSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const helpKind = record['helpKind'];
  const vehicleKind = record['vehicleKind'];
  const reference = typeof record['reference'] === 'string' ? record['reference'].trim() : '';
  const mobile = typeof record['mobile'] === 'string' ? record['mobile'] : '';
  const serviceTitleValue =
    typeof record['serviceTitle'] === 'string' ? record['serviceTitle'].trim() : '';
  const vehicleDetail =
    typeof record['vehicleDetail'] === 'string' ? record['vehicleDetail'].trim() : '';
  const city = typeof record['city'] === 'string' ? record['city'].trim() : '';
  const whenLabel = typeof record['whenLabel'] === 'string' ? record['whenLabel'].trim() : '';
  const submittedAt = typeof record['submittedAt'] === 'string' ? record['submittedAt'] : '';

  if (helpKind !== 'roadside' && helpKind !== 'doorstep') {
    return null;
  }

  if (vehicleKind !== 'car' && vehicleKind !== 'bike') {
    return null;
  }

  if (!reference || !serviceTitleValue || !city || !whenLabel || !submittedAt) {
    return null;
  }

  if (!isValidMobile(mobile) || Number.isNaN(new Date(submittedAt).getTime())) {
    return null;
  }

  return {
    reference,
    mobile: normalizeMobile(mobile),
    helpKind,
    serviceTitle: serviceTitleValue,
    vehicleKind,
    vehicleDetail,
    city,
    whenLabel,
    submittedAt,
  };
}
