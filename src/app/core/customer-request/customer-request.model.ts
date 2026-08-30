import {
  SERVICE_CATEGORIES,
  ServiceCategoryId,
  VehicleService,
} from '../../pages/landing/landing.content';

export type HelpKind = 'roadside' | 'doorstep';
export type RequestVehicleKind = 'car' | 'bike';
export type ScheduleWhen = 'today' | 'tomorrow' | 'custom';

export type RequestStep =
  | 'kind'
  | 'service'
  | 'vehicle'
  | 'location'
  | 'contact'
  | 'otp'
  | 'review'
  | 'submitted';

export interface RequestChoice<T extends string> {
  readonly value: T;
  readonly title: string;
  readonly description: string;
}

export interface CustomerRequestDraft {
  readonly helpKind: HelpKind | '';
  readonly serviceId: string;
  readonly otherDetails: string;
  readonly vehicleKind: RequestVehicleKind | '';
  readonly vehicleDetail: string;
  readonly city: string;
  readonly location: string;
  readonly notes: string;
  readonly scheduleWhen: ScheduleWhen | '';
  readonly scheduleDate: string;
  readonly scheduleTime: string;
  readonly fullName: string;
  readonly mobile: string;
  readonly mobileVerified: boolean;
  readonly reference: string;
}

export const OTHER_ISSUE_ID = 'other-issue';

export const FORM_STEPS: readonly RequestStep[] = [
  'kind',
  'service',
  'vehicle',
  'location',
  'contact',
  'otp',
  'review',
];

export const HELP_KIND_OPTIONS: readonly RequestChoice<HelpKind>[] = [
  {
    value: 'roadside',
    title: 'Roadside emergency',
    description: 'I am stranded or need help where the vehicle is now.',
  },
  {
    value: 'doorstep',
    title: 'Doorstep service',
    description: 'I want scheduled vehicle care at a location I choose.',
  },
];

export const REQUEST_VEHICLE_OPTIONS: readonly RequestChoice<RequestVehicleKind>[] = [
  { value: 'car', title: 'Car', description: 'A passenger car or similar vehicle.' },
  { value: 'bike', title: 'Bike', description: 'A motorcycle or scooter.' },
];

export const SCHEDULE_OPTIONS: readonly RequestChoice<ScheduleWhen>[] = [
  {
    value: 'today',
    title: 'Today',
    description: 'Come later today at a time that works.',
  },
  {
    value: 'tomorrow',
    title: 'Tomorrow',
    description: 'Come sometime tomorrow.',
  },
  {
    value: 'custom',
    title: 'Pick a time',
    description: 'Choose a date and a starting time.',
  },
];

export const SCHEDULE_TIME_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
];

const DOORSTEP_OTHER: VehicleService = {
  id: OTHER_ISSUE_ID,
  title: 'Other',
  description: 'Describe the work you need at your location.',
  icon: 'other',
};

export function emptyRequestDraft(): CustomerRequestDraft {
  return {
    helpKind: '',
    serviceId: '',
    otherDetails: '',
    vehicleKind: '',
    vehicleDetail: '',
    city: '',
    location: '',
    notes: '',
    scheduleWhen: '',
    scheduleDate: '',
    scheduleTime: '',
    fullName: '',
    mobile: '',
    mobileVerified: false,
    reference: '',
  };
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateOnOrAfterToday(isoDate: string, now = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) && isoDate >= todayIsoDate(now);
}

export function createRequestReference(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return `MR-${String(bytes[0] % 10_000).padStart(4, '0')}`;
}

export function scheduledAtFromDraft(
  draft: CustomerRequestDraft,
  now = new Date(),
): string | null {
  if (draft.helpKind !== 'doorstep') {
    return null;
  }

  if (draft.scheduleWhen === 'custom' && draft.scheduleDate && draft.scheduleTime) {
    const local = new Date(`${draft.scheduleDate}T${draft.scheduleTime}:00`);
    return Number.isNaN(local.getTime()) ? null : local.toISOString();
  }

  if (draft.scheduleWhen !== 'today' && draft.scheduleWhen !== 'tomorrow') {
    return null;
  }

  const scheduled = new Date(now);
  if (draft.scheduleWhen === 'tomorrow') {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  scheduled.setHours(9, 0, 0, 0);
  return scheduled.toISOString();
}

export function scheduleSummary(
  helpKind: HelpKind | '',
  when: ScheduleWhen | '',
  date: string,
  time: string,
): string {
  if (helpKind !== 'doorstep') {
    return 'As soon as possible';
  }

  switch (when) {
    case 'today':
      return 'Today';
    case 'tomorrow':
      return 'Tomorrow';
    case 'custom': {
      const dateLabel = formatIsoDateLabel(date);
      const timeLabel = SCHEDULE_TIME_OPTIONS.find((option) => option.value === time)?.label;
      if (dateLabel && timeLabel) {
        return `${dateLabel} · ${timeLabel}`;
      }
      return dateLabel || timeLabel || '';
    }
    default:
      return '';
  }
}

function formatIsoDateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return '';
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function parseHelpKind(value: string | null): HelpKind | '' {
  if (value === 'doorstep') {
    return 'doorstep';
  }
  if (value === 'roadside' || value === 'emergency-roadside') {
    return 'roadside';
  }
  return '';
}

export function helpKindFromCategory(id: ServiceCategoryId): HelpKind {
  return id === 'doorstep' ? 'doorstep' : 'roadside';
}

export function categoryIdFromHelpKind(kind: HelpKind): ServiceCategoryId {
  return kind === 'doorstep' ? 'doorstep' : 'emergency-roadside';
}

export function servicesForKind(kind: HelpKind): readonly VehicleService[] {
  const category = SERVICE_CATEGORIES.find((item) => item.id === categoryIdFromHelpKind(kind));
  const services = category?.services ?? [];
  if (kind === 'doorstep' && !services.some((service) => service.id === OTHER_ISSUE_ID)) {
    return [...services, DOORSTEP_OTHER];
  }
  return services;
}

export function isServiceForKind(kind: HelpKind, serviceId: string): boolean {
  return servicesForKind(kind).some((service) => service.id === serviceId);
}

export function kindFromServiceId(serviceId: string): HelpKind | '' {
  if (!serviceId) {
    return '';
  }
  if (isServiceForKind('roadside', serviceId)) {
    return 'roadside';
  }
  if (isServiceForKind('doorstep', serviceId)) {
    return 'doorstep';
  }
  return '';
}

export function serviceTitle(id: string, kind: HelpKind | ''): string {
  if (!kind) {
    return id;
  }
  return servicesForKind(kind).find((service) => service.id === id)?.title ?? id;
}

export function helpKindLabel(kind: HelpKind | ''): string {
  return HELP_KIND_OPTIONS.find((option) => option.value === kind)?.title ?? '';
}

export function vehicleLabel(kind: RequestVehicleKind | ''): string {
  return REQUEST_VEHICLE_OPTIONS.find((option) => option.value === kind)?.title ?? '';
}
