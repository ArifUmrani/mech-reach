import { TestBed } from '@angular/core/testing';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { emptyRequestDraft } from '../customer-request/customer-request.model';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { JobService } from './jobs.service';

const insertedJob = {
  id: 'job-1',
  reference: 'MR-8F42C1',
  customer_id: 'user-1',
  help_kind: 'roadside',
  service_id: 'battery-jump-start',
  service_title: 'Battery Jump Start',
  other_details: '',
  vehicle_kind: 'car',
  vehicle_detail: 'Honda Civic 2018',
  city: 'Karachi',
  location_text: 'Clifton',
  notes: '',
  scheduled_at: null,
  status: 'requested',
  created_at: '2026-08-30T08:00:00.000Z',
};

describe('JobService', () => {
  it('inserts a job for the signed-in customer and lists it', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CustomerAuthService,
          useValue: { userId: () => 'user-1' },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: () => ({
              insert: () => ({
                select: () => ({
                  single: async () => ({ data: insertedJob, error: null }),
                }),
              }),
              select: () => ({
                eq: () => ({
                  order: async () => ({ data: [insertedJob], error: null }),
                }),
              }),
            }),
          },
        },
      ],
    });
    const jobs = TestBed.inject(JobService);
    const result = await jobs.createFromDraft({
      ...emptyRequestDraft(),
      helpKind: 'roadside',
      serviceId: 'battery-jump-start',
      vehicleKind: 'car',
      vehicleDetail: 'Honda Civic 2018',
      city: 'Karachi',
      location: 'Clifton',
      mobile: '+923001234567',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.job.reference).toBe('MR-8F42C1');
    }

    await jobs.refresh();
    expect(jobs.items()).toHaveLength(1);
    expect(jobs.items()[0]?.city).toBe('Karachi');
  });

  it('does not insert when there is no authenticated user', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CustomerAuthService, useValue: { userId: () => null } },
        { provide: SUPABASE_CLIENT, useValue: {} },
      ],
    });
    const jobs = TestBed.inject(JobService);
    const result = await jobs.createFromDraft(emptyRequestDraft());
    expect(result.ok).toBe(false);
  });
});
