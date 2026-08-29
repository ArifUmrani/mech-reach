export type PracticeKind = 'independent' | 'workshop';
export type VehicleKind = 'car' | 'bike' | 'both';
export type CoverageKind = 'roadside' | 'doorstep' | 'both';
export type HoursKind = 'all-day' | 'twelve-hour' | 'daytime' | 'custom';
export type WeekdayId =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type JoinStep =
  | 'mobile'
  | 'otp'
  | 'profile'
  | 'practice'
  | 'experience'
  | 'vehicles'
  | 'services'
  | 'coverage'
  | 'location'
  | 'availability'
  | 'identity'
  | 'terms'
  | 'review'
  | 'submitted';

export interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly title: string;
  readonly description: string;
}

export interface UploadedFileRef {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly previewUrl: string | null;
}

export interface MechanicJoinDraft {
  readonly mobile: string;
  readonly mobileVerified: boolean;
  readonly fullName: string;
  readonly email: string;
  readonly photo: UploadedFileRef | null;
  readonly practiceKind: PracticeKind | '';
  readonly workshopName: string;
  readonly yearsExperience: string;
  readonly vehicleKind: VehicleKind | '';
  readonly serviceIds: readonly string[];
  readonly otherServices: string;
  readonly coverageKind: CoverageKind | '';
  readonly city: string;
  readonly serviceAreas: string;
  readonly travelKm: string;
  readonly availableDays: readonly WeekdayId[];
  readonly hoursKind: HoursKind | '';
  readonly availableFrom: string;
  readonly availableTo: string;
  readonly identityDocument: UploadedFileRef | null;
  readonly termsAccepted: boolean;
}

export const FORM_STEPS: readonly JoinStep[] = [
  'mobile',
  'otp',
  'profile',
  'practice',
  'experience',
  'vehicles',
  'services',
  'coverage',
  'location',
  'availability',
  'identity',
  'terms',
  'review',
];

export const STEP_TITLES: Record<JoinStep, string> = {
  mobile: 'Mobile number',
  otp: 'Confirm number',
  profile: 'Your profile',
  practice: 'How you work',
  experience: 'Experience',
  vehicles: 'Vehicles you service',
  services: 'Services you offer',
  coverage: 'Where you help',
  location: 'Service area',
  availability: 'Availability',
  identity: 'Identity document',
  terms: 'Terms',
  review: 'Review',
  submitted: 'Application under review',
};

export const PRACTICE_OPTIONS: readonly ChoiceOption<PracticeKind>[] = [
  {
    value: 'independent',
    title: 'Independent mechanic',
    description: 'I take jobs on my own.',
  },
  {
    value: 'workshop',
    title: 'Workshop',
    description: 'I work with or run a workshop.',
  },
];

export const VEHICLE_OPTIONS: readonly ChoiceOption<VehicleKind>[] = [
  { value: 'car', title: 'Cars', description: 'Passenger cars and similar vehicles.' },
  { value: 'bike', title: 'Bikes', description: 'Motorcycles and scooters.' },
  { value: 'both', title: 'Cars and bikes', description: 'I can take both types of jobs.' },
];

export const COVERAGE_OPTIONS: readonly ChoiceOption<CoverageKind>[] = [
  {
    value: 'roadside',
    title: 'Roadside emergencies',
    description: 'Help when a vehicle is stranded.',
  },
  {
    value: 'doorstep',
    title: 'Doorstep services',
    description: 'Scheduled work at a location the customer chooses.',
  },
  {
    value: 'both',
    title: 'Roadside and doorstep',
    description: 'I can take both kinds of jobs.',
  },
];

export const WEEKDAYS: readonly { id: WeekdayId; label: string }[] = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export const OTHER_SERVICE_ID = 'others';
export const OTHER_SERVICE_TITLE = 'Others';

export const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const IDENTITY_TYPES = new Set([...PHOTO_TYPES, 'application/pdf']);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function emptyDraft(): MechanicJoinDraft {
  return {
    mobile: '',
    mobileVerified: false,
    fullName: '',
    email: '',
    photo: null,
    practiceKind: '',
    workshopName: '',
    yearsExperience: '',
    vehicleKind: '',
    serviceIds: [],
    otherServices: '',
    coverageKind: '',
    city: '',
    serviceAreas: '',
    travelKm: '',
    availableDays: [],
    hoursKind: '',
    availableFrom: '',
    availableTo: '',
    identityDocument: null,
    termsAccepted: false,
  };
}

export function weekdayLabel(id: WeekdayId): string {
  return WEEKDAYS.find((day) => day.id === id)?.label ?? id;
}

