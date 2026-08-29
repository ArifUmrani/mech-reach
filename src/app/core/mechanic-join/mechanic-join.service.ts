import { DestroyRef, inject, Service, signal } from '@angular/core';
import {
  IDENTITY_TYPES,
  MAX_UPLOAD_BYTES,
  MechanicJoinDraft,
  PHOTO_TYPES,
  UploadedFileRef,
  emptyDraft,
} from './mechanic-join.model';
import { maskMobile, normalizeMobile } from './mobile';

export type OtpVerifyResult = 'ok' | 'expired' | 'mismatch' | 'missing';
export type UploadResult = { readonly ok: true; readonly file: UploadedFileRef } | { readonly ok: false; readonly message: string };

interface OtpChallenge {
  readonly mobile: string;
  readonly code: string;
  readonly expiresAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

@Service()
export class MechanicJoinService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly draftState = signal<MechanicJoinDraft>(emptyDraft());
  private readonly challenge = signal<OtpChallenge | null>(null);
  private readonly submittedState = signal(false);

  readonly draft = this.draftState.asReadonly();
  readonly submitted = this.submittedState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeAllPreviews());
  }

  patch(partial: Partial<MechanicJoinDraft>): void {
    this.draftState.update((current) => ({ ...current, ...partial }));
  }

  requestOtp(mobile: string): { readonly mobile: string; readonly code: string } {
    const normalized = normalizeMobile(mobile);
    const code = this.generateOtp();
    this.challenge.set({
      mobile: normalized,
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    this.patch({ mobile: normalized, mobileVerified: false });
    return { mobile: normalized, code };
  }

  verifyOtp(code: string): OtpVerifyResult {
    const current = this.challenge();
    if (!current) {
      return 'missing';
    }

    if (Date.now() > current.expiresAt) {
      return 'expired';
    }

    if (code.trim() !== current.code) {
      return 'mismatch';
    }

    this.patch({ mobile: current.mobile, mobileVerified: true });
    return 'ok';
  }

  maskedMobile(): string {
    const mobile = this.draftState().mobile || this.challenge()?.mobile;
    return mobile ? maskMobile(mobile) : '';
  }

  acceptPhoto(file: File): UploadResult {
    return this.acceptFile(file, PHOTO_TYPES, true, 'Choose a JPEG, PNG, or WebP image.');
  }

  acceptIdentity(file: File): UploadResult {
    return this.acceptFile(
      file,
      IDENTITY_TYPES,
      file.type.startsWith('image/'),
      'Choose a JPEG, PNG, WebP, or PDF file.',
    );
  }

  replacePhoto(file: File): UploadResult {
    const result = this.acceptPhoto(file);
    if (result.ok) {
      this.revokePreview(this.draftState().photo);
      this.patch({ photo: result.file });
    }
    return result;
  }

  replaceIdentity(file: File): UploadResult {
    const result = this.acceptIdentity(file);
    if (result.ok) {
      this.revokePreview(this.draftState().identityDocument);
      this.patch({ identityDocument: result.file });
    }
    return result;
  }

  clearPhoto(): void {
    this.revokePreview(this.draftState().photo);
    this.patch({ photo: null });
  }

  submitApplication(): void {
    this.submittedState.set(true);
  }

  private acceptFile(
    file: File,
    types: Set<string>,
    withPreview: boolean,
    invalidTypeMessage: string,
  ): UploadResult {
    if (!types.has(file.type)) {
      return { ok: false, message: invalidTypeMessage };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: 'Keep the file under 5 MB.' };
    }

    return {
      ok: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: withPreview ? URL.createObjectURL(file) : null,
      },
    };
  }

  private revokePreview(file: UploadedFileRef | null): void {
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
  }

  private revokeAllPreviews(): void {
    const current = this.draftState();
    this.revokePreview(current.photo);
    this.revokePreview(current.identityDocument);
  }

  private generateOtp(): string {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(bytes[0] % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, '0');
  }
}
