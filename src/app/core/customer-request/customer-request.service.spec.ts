import { TestBed } from '@angular/core/testing';
import { JobService } from '../jobs/jobs.service';
import { CustomerRequestService } from './customer-request.service';
import {
  createRequestReference,
  emptyRequestDraft,
  isDateOnOrAfterToday,
  isServiceForKind,
  kindFromServiceId,
  parseHelpKind,
  scheduledAtFromDraft,
  scheduleSummary,
  servicesForKind,
  todayIsoDate,
} from './customer-request.model';

describe('request catalog helpers', () => {
  it('accepts landing and short help-kind query values', () => {
    expect(parseHelpKind('roadside')).toBe('roadside');
    expect(parseHelpKind('emergency-roadside')).toBe('roadside');
    expect(parseHelpKind('doorstep')).toBe('doorstep');
    expect(parseHelpKind('unknown')).toBe('');
  });

  it('includes Other for doorstep and keeps the landing Other Issue for roadside', () => {
    expect(isServiceForKind('roadside', 'other-issue')).toBe(true);
    expect(isServiceForKind('doorstep', 'other-issue')).toBe(true);
    expect(isServiceForKind('roadside', 'engine-oil-change')).toBe(false);
    expect(servicesForKind('doorstep').some((service) => service.id === 'other-issue')).toBe(true);
  });

  it('infers help kind from a known service id', () => {
    expect(kindFromServiceId('battery-jump-start')).toBe('roadside');
    expect(kindFromServiceId('engine-oil-change')).toBe('doorstep');
  });
});

describe('CustomerRequestService', () => {
  it('stores the database reference on submit and clears it on reset', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: JobService,
          useValue: {
            createFromDraft: async () => ({
              ok: true,
              job: { reference: 'MR-8F42C1' },
            }),
          },
        },
      ],
    });
    const service = TestBed.inject(CustomerRequestService);
    service.patch({ city: 'Karachi' });
    expect(await service.submitRequest()).toBe('ok');
    expect(service.submitted()).toBe(true);
    expect(service.draft().reference).toBe('MR-8F42C1');

    service.reset();
    expect(service.submitted()).toBe(false);
    expect(service.draft().city).toBe('');
    expect(service.draft().reference).toBe('');
  });
});

describe('request schedule helpers', () => {
  it('formats roadside as now and doorstep as a chosen window', () => {
    expect(scheduleSummary('roadside', 'today', '', '')).toBe('As soon as possible');
    expect(scheduleSummary('doorstep', 'today', '', '')).toBe('Today');
    expect(scheduleSummary('doorstep', 'tomorrow', '', '')).toBe('Tomorrow');
    expect(scheduleSummary('doorstep', 'custom', '2026-09-02', '10:00')).toContain('10:00 AM');
  });

  it('creates a four-digit local request reference helper', () => {
    expect(createRequestReference()).toMatch(/^MR-\d{4}$/);
  });

  it('maps doorstep timing to a timestamp and roadside to null', () => {
    const now = new Date(2026, 8, 1, 15, 0, 0);
    expect(scheduledAtFromDraft({ ...emptyRequestDraft(), helpKind: 'roadside' }, now)).toBeNull();
    const tomorrow = scheduledAtFromDraft(
      { ...emptyRequestDraft(), helpKind: 'doorstep', scheduleWhen: 'tomorrow' },
      now,
    );
    expect(tomorrow).toContain('2026-09-02');
  });

  it('accepts today and later dates in local ISO form', () => {
    const now = new Date(2026, 8, 1, 15, 0, 0);
    expect(todayIsoDate(now)).toBe('2026-09-01');
    expect(isDateOnOrAfterToday('2026-09-01', now)).toBe(true);
    expect(isDateOnOrAfterToday('2026-08-31', now)).toBe(false);
  });
});
