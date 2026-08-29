import { TestBed } from '@angular/core/testing';
import { CUSTOMER_SESSION_STORAGE_KEY } from '../customer-auth/customer-auth.model';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { CUSTOMER_REQUEST_HISTORY_STORAGE_KEY } from './customer-request-history.model';
import { CustomerRequestHistoryService } from './customer-request-history.service';
import { CustomerRequestService } from './customer-request.service';
import {
  createRequestReference,
  isDateOnOrAfterToday,
  isServiceForKind,
  kindFromServiceId,
  parseHelpKind,
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
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
  });

  afterEach(() => {
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
  });
  it('verifies a freshly generated code and rejects a mismatch', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(CustomerRequestService);
    const challenge = service.requestOtp('+92 300 1234567');

    expect(service.verifyOtp('000000')).toBe('mismatch');
    expect(service.verifyOtp(challenge.code)).toBe('ok');
    expect(service.draft().mobileVerified).toBe(true);
  });

  it('assigns a request reference on submit and clears it on reset', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(CustomerRequestService);
    service.patch({ city: 'Karachi' });
    service.submitRequest();

    expect(service.submitted()).toBe(true);
    expect(service.draft().reference).toMatch(/^MR-\d{4}$/);
    expect(sessionStorage.getItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY)).toBeNull();

    service.reset();
    expect(service.submitted()).toBe(false);
    expect(service.draft().city).toBe('');
    expect(service.draft().reference).toBe('');
    expect(service.draft().mobileVerified).toBe(false);
  });

  it('stores a snapshot for a signed-in matching mobile', () => {
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
    TestBed.configureTestingModule({});
    const auth = TestBed.inject(CustomerAuthService);
    const history = TestBed.inject(CustomerRequestHistoryService);
    const service = TestBed.inject(CustomerRequestService);
    const challenge = auth.requestOtp('Arif', '+92 300 1234567');
    expect(auth.verifyOtp(challenge.code)).toBe('ok');

    service.patch({
      helpKind: 'roadside',
      serviceId: 'battery-jump-start',
      vehicleKind: 'car',
      city: 'Karachi',
      mobile: '+923001234567',
    });
    service.submitRequest();

    expect(history.items()).toHaveLength(1);
    expect(history.items()[0]?.city).toBe('Karachi');
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY);
  });
});

describe('request schedule helpers', () => {
  it('formats roadside as now and doorstep as a chosen window', () => {
    expect(scheduleSummary('roadside', 'today', '', '')).toBe('As soon as possible');
    expect(scheduleSummary('doorstep', 'today', '', '')).toBe('Today');
    expect(scheduleSummary('doorstep', 'tomorrow', '', '')).toBe('Tomorrow');
    expect(scheduleSummary('doorstep', 'custom', '2026-09-02', '10:00')).toContain('10:00 AM');
  });

  it('creates a four-digit local request reference', () => {
    expect(createRequestReference()).toMatch(/^MR-\d{4}$/);
  });

  it('accepts today and later dates in local ISO form', () => {
    const now = new Date(2026, 8, 1, 15, 0, 0);
    expect(todayIsoDate(now)).toBe('2026-09-01');
    expect(isDateOnOrAfterToday('2026-09-01', now)).toBe(true);
    expect(isDateOnOrAfterToday('2026-08-31', now)).toBe(false);
  });
});
