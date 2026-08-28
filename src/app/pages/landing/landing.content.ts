export type ServiceIconName =
  | 'battery-jump'
  | 'flat-tyre'
  | 'not-starting'
  | 'overheating'
  | 'fuel'
  | 'towing'
  | 'other'
  | 'oil-change'
  | 'battery-inspection'
  | 'inspection'
  | 'maintenance';

export type ServiceCategoryId = 'emergency-roadside' | 'doorstep';

export interface VehicleService {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: ServiceIconName;
}

export interface ServiceCategory {
  readonly id: ServiceCategoryId;
  readonly title: string;
  readonly summary: string;
  readonly services: readonly VehicleService[];
}

export interface ProcessStep {
  readonly id: string;
  readonly step: number;
  readonly title: string;
  readonly description: string;
}

export interface TrustItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface SafetyPrinciple {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'emergency-roadside',
    title: 'Emergency Roadside Help',
    summary: 'Immediate support when something goes wrong on the road.',
    services: [
      {
        id: 'battery-jump-start',
        title: 'Battery Jump Start',
        description: 'Get help when a dead battery leaves you stranded.',
        icon: 'battery-jump',
      },
      {
        id: 'flat-tyre',
        title: 'Flat Tyre',
        description: 'Swap or repair a flat so you can get moving again.',
        icon: 'flat-tyre',
      },
      {
        id: 'vehicle-not-starting',
        title: 'Vehicle Not Starting',
        description: 'Connect with a mechanic when your vehicle will not start.',
        icon: 'not-starting',
      },
      {
        id: 'overheating',
        title: 'Overheating',
        description: 'Support when your engine is running hotter than it should.',
        icon: 'overheating',
      },
      {
        id: 'emergency-fuel',
        title: 'Emergency Fuel',
        description: 'Emergency fuel delivery when you run out unexpectedly.',
        icon: 'fuel',
      },
      {
        id: 'towing',
        title: 'Towing',
        description: 'Towing support when your vehicle cannot be driven safely.',
        icon: 'towing',
      },
      {
        id: 'other-issue',
        title: 'Other Issue',
        description: 'Describe the issue and get connected with a mechanic.',
        icon: 'other',
      },
    ],
  },
  {
    id: 'doorstep',
    title: 'Doorstep Services',
    summary: 'Scheduled vehicle care at home, work, or another location you choose.',
    services: [
      {
        id: 'engine-oil-change',
        title: 'Engine Oil Change',
        description: 'Book an oil change without taking time out for a shop visit.',
        icon: 'oil-change',
      },
      {
        id: 'battery-inspection',
        title: 'Battery Inspection',
        description: 'Have your battery checked before it becomes an emergency.',
        icon: 'battery-inspection',
      },
      {
        id: 'general-vehicle-inspection',
        title: 'General Vehicle Inspection',
        description: 'A general vehicle check at the location that works for you.',
        icon: 'inspection',
      },
      {
        id: 'scheduled-maintenance',
        title: 'Scheduled Maintenance',
        description: 'Routine maintenance arranged around your schedule.',
        icon: 'maintenance',
      },
    ],
  },
];

export const TRUST_ITEMS: readonly TrustItem[] = [
  {
    id: 'verified-mechanics',
    title: 'Verified mechanics',
    description: 'Designed so customers can connect with mechanics who have been reviewed for the platform.',
  },
  {
    id: 'clear-process',
    title: 'Clear service process',
    description: 'Every request follows simple steps from describing the issue to receiving help.',
  },
  {
    id: 'roadside-and-doorstep',
    title: 'Roadside and doorstep support',
    description: 'Emergency help on the road, plus scheduled services at your chosen location.',
  },
];

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: 'tell-us',
    step: 1,
    title: 'Tell Us What You Need',
    description:
      'Share whether you need emergency roadside help or a scheduled doorstep service, then describe the issue.',
  },
  {
    id: 'get-connected',
    step: 2,
    title: 'Get Connected With a Mechanic',
    description: 'MechReach connects you with a mechanic who can take on the job at your location.',
  },
  {
    id: 'receive-help',
    step: 3,
    title: 'Receive Help at Your Location',
    description:
      'Receive help at the roadside or at the doorstep location you choose, with clear updates along the way.',
  },
];

export const SAFETY_PRINCIPLES: readonly SafetyPrinciple[] = [
  {
    id: 'verification',
    title: 'Mechanic verification',
    description: 'The platform is being designed so mechanics can be reviewed before they take on customer jobs.',
  },
  {
    id: 'communication',
    title: 'Clear customer communication',
    description: 'Requests, updates, and next steps should stay easy to follow from start to finish.',
  },
  {
    id: 'transparency',
    title: 'Transparent service steps',
    description: 'Customers should always know what they asked for, who is helping, and what happens next.',
  },
  {
    id: 'location',
    title: 'Help at your selected location',
    description: 'Whether you are on the roadside or at home, help is meant to come to you.',
  },
];
