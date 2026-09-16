import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { AdminMechanicApplicationsService } from './admin-mechanic-applications.service';

const pendingApplication = {
  id: 'application-1',
  mechanic_id: 'mechanic-1',
  full_name: 'Bilal',
  email: '',
  photo_path: null,
  practice_kind: 'independent',
  workshop_name: '',
  years_experience: 5,
  vehicle_kind: 'car',
  service_ids: ['battery-jump-start'],
  other_services: '',
  coverage_kind: 'roadside',
  city: 'Karachi',
  service_areas: 'Clifton',
  travel_km: 20,
  available_days: ['monday'],
  hours_kind: 'all-day',
  available_from: null,
  available_to: null,
  identity_document_path: 'mechanic-1/identity-1.jpg',
  terms_accepted: true,
  status: 'pending',
  created_at: '2026-09-10T08:00:00.000Z',
  profiles: { mobile_e164: '+923012888918' },
};

describe('AdminMechanicApplicationsService', () => {
  it('lists applications with the applicant mobile embedded', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: () => ({
              select: () => ({
                order: async () => ({ data: [pendingApplication], error: null }),
              }),
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(AdminMechanicApplicationsService);
    await service.refresh();

    expect(service.items().length).toBe(1);
    expect(service.items()[0].profiles?.mobile_e164).toBe('+923012888918');
  });

  it('approves an application and updates it in place', async () => {
    let updatedTo: string | null = null;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: () => ({
              select: () => ({
                order: async () => ({ data: [pendingApplication], error: null }),
              }),
              update: (values: { status: string }) => {
                updatedTo = values.status;
                return {
                  eq: () => ({
                    select: () => ({
                      single: async () => ({
                        data: { ...pendingApplication, status: values.status },
                        error: null,
                      }),
                    }),
                  }),
                };
              },
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(AdminMechanicApplicationsService);
    await service.refresh();

    const result = await service.approve('application-1');
    expect(result.ok).toBe(true);
    expect(updatedTo).toBe('approved');
    expect(service.items()[0].status).toBe('approved');
  });

  it('returns an error result when the update fails', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            from: () => ({
              update: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: null, error: { message: 'nope' } }),
                  }),
                }),
              }),
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(AdminMechanicApplicationsService);
    const result = await service.reject('application-1');
    expect(result.ok).toBe(false);
  });

  it('returns null for a signed document URL when the request fails', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            storage: {
              from: () => ({
                createSignedUrl: async () => ({ data: null, error: { message: 'not found' } }),
              }),
            },
          },
        },
      ],
    });

    const service = TestBed.inject(AdminMechanicApplicationsService);
    const url = await service.documentUrl('mechanic-1/identity-1.jpg');
    expect(url).toBeNull();
  });
});
