import { TestBed } from '@angular/core/testing';
import { MechanicAuthService } from '../mechanic-auth/mechanic-auth.service';
import { emptyDraft } from '../mechanic-join/mechanic-join.model';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { MechanicApplicationService } from './mechanic-application.service';

const insertedApplication = {
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
};

function fakeFile(name: string, type: string): File {
  return new File(['data'], name, { type });
}

describe('MechanicApplicationService', () => {
  it('uploads documents and inserts an application for the signed-in mechanic', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MechanicAuthService,
          useValue: { userId: () => 'mechanic-1' },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            storage: {
              from: () => ({
                upload: async () => ({ error: null }),
              }),
            },
            from: () => ({
              insert: () => ({
                select: () => ({
                  single: async () => ({ data: insertedApplication, error: null }),
                }),
              }),
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [insertedApplication], error: null }),
                  }),
                }),
              }),
            }),
          },
        },
      ],
    });

    const service = TestBed.inject(MechanicApplicationService);
    const draft = {
      ...emptyDraft(),
      mobile: '+923012888918',
      mobileVerified: true,
      fullName: 'Bilal',
      practiceKind: 'independent' as const,
      yearsExperience: '5',
      vehicleKind: 'car' as const,
      serviceIds: ['battery-jump-start'],
      coverageKind: 'roadside' as const,
      city: 'Karachi',
      serviceAreas: 'Clifton',
      travelKm: '20',
      availableDays: ['monday' as const],
      hoursKind: 'all-day' as const,
      identityDocument: {
        name: 'cnic.jpg',
        size: 1024,
        type: 'image/jpeg',
        previewUrl: null,
        raw: fakeFile('cnic.jpg', 'image/jpeg'),
      },
      termsAccepted: true,
    };

    const result = await service.submitApplication(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.city).toBe('Karachi');
    }

    await service.refresh();
    expect(service.application()?.status).toBe('pending');
  });

  it('does not submit when there is no authenticated mechanic', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MechanicAuthService, useValue: { userId: () => null } },
        { provide: SUPABASE_CLIENT, useValue: {} },
      ],
    });
    const service = TestBed.inject(MechanicApplicationService);
    const result = await service.submitApplication(emptyDraft());
    expect(result.ok).toBe(false);
  });
});
