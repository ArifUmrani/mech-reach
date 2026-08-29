import { TestBed } from '@angular/core/testing';
import { MechanicJoinService } from './mechanic-join.service';
import { isValidMobile, maskMobile, normalizeMobile } from './mobile';

describe('mobile helpers', () => {
  it('accepts local and international numbers', () => {
    expect(isValidMobile('+92 300 1234567')).toBe(true);
    expect(isValidMobile('03001234567')).toBe(true);
    expect(isValidMobile('123')).toBe(false);
  });

  it('normalizes spacing while keeping a leading plus', () => {
    expect(normalizeMobile('+92 300 1234567')).toBe('+923001234567');
  });

  it('masks all but the last four digits', () => {
    expect(maskMobile('+923001234567')).toBe('•••• 4567');
  });
});

describe('MechanicJoinService', () => {
  it('verifies a freshly generated code and rejects a mismatch', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(MechanicJoinService);
    const challenge = service.requestOtp('+92 300 1234567');

    expect(service.verifyOtp('000000')).toBe('mismatch');
    expect(service.verifyOtp(challenge.code)).toBe('ok');
    expect(service.draft().mobileVerified).toBe(true);
  });

  it('rejects a photo that is not an allowed image type', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(MechanicJoinService);
    const file = new File(['id'], 'id.txt', { type: 'text/plain' });

    expect(service.replacePhoto(file)).toEqual({
      ok: false,
      message: 'Choose a JPEG, PNG, or WebP image.',
    });
  });

  it('accepts a PDF identity document without a preview', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(MechanicJoinService);
    const file = new File(['%PDF-1.4'], 'cnic.pdf', { type: 'application/pdf' });
    const result = service.replaceIdentity(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.name).toBe('cnic.pdf');
      expect(result.file.previewUrl).toBeNull();
    }
    expect(service.draft().identityDocument?.name).toBe('cnic.pdf');
  });
});
