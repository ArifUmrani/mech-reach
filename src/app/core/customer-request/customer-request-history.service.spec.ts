import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { emptyRequestDraft } from './customer-request.model';
import {
  CUSTOMER_REQUEST_HISTORY_STORAGE_KEY,
  parseCustomerRequestHistory,
  snapshotFromDraft,
} from './customer-request-history.model';
import { CustomerRequestHistoryService } from './customer-request-history.service';

function signedInDraft() {
  return {
    ...emptyRequestDraft(),
    helpKind: 'roadside' as const,
    serviceId: 'battery-jump-start',
    vehicleKind: 'car' as const,
    vehicleDetail: 'Honda Civic 2018',
    city: 'Karachi',
    mobile: '+923001234567',
    mobileVerified: true,
    reference: 'MR-8266',
  };
}

describe('parseCustomerRequestHistory', () => {
  it('accepts a valid snapshot and drops incomplete rows', () => {
    const valid = snapshotFromDraft(signedInDraft(), '2026-08-30T01:00:00.000Z');
    expect(valid?.serviceTitle).toBe('Battery Jump Start');
    expect(
      parseCustomerRequestHistory(JSON.stringify([valid, { reference: 'MR-0001' }])),
    ).toEqual([valid]);
    expect(parseCustomerRequestHistory('not-json')).toEqual([]);
  });
});

describe('CustomerRequestHistoryService', () => {
  const session = signal({ id: 'user-1', fullName: 'Arif', mobile: '+923001234567' });

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CustomerAuthService,
          useValue: {
            session: session.asReadonly(),
            matchesVerifiedMobile: (mobile: string) =>
              session() !== null && mobile.replace(/\D/g, '').endsWith('3001234567'),
          },
        },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
  });

  it('records a snapshot only for the signed-in mobile', () => {
    session.set({ id: 'user-1', fullName: 'Arif', mobile: '+923001234567' });
    const history = TestBed.inject(CustomerRequestHistoryService);

    history.record({ ...signedInDraft(), mobile: '+92 333 1111111' });
    expect(history.items()).toEqual([]);

    history.record(signedInDraft());
    expect(history.items()).toHaveLength(1);
    expect(history.items()[0]?.reference).toBe('MR-8266');
  });
});
