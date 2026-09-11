import { DestroyRef, inject, Service, signal } from '@angular/core';
import {
  IDENTITY_TYPES,
  MAX_UPLOAD_BYTES,
  MechanicJoinDraft,
  PHOTO_TYPES,
  UploadedFileRef,
  emptyDraft,
} from './mechanic-join.model';
import { maskMobile } from './mobile';

export type UploadResult = { readonly ok: true; readonly file: UploadedFileRef } | { readonly ok: false; readonly message: string };

/**
 * Holds the mechanic-join wizard's local draft and file selections. Phone
 * verification is handled by `MechanicAuthService`; final submission and
 * document upload are handled by `MechanicApplicationService`. This service
 * only owns in-memory, not-yet-submitted form state.
 */
@Service()
export class MechanicJoinService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly draftState = signal<MechanicJoinDraft>(emptyDraft());
  private readonly submittedState = signal(false);

  readonly draft = this.draftState.asReadonly();
  readonly submitted = this.submittedState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeAllPreviews());
  }

  patch(partial: Partial<MechanicJoinDraft>): void {
    this.draftState.update((current) => ({ ...current, ...partial }));
  }

  maskedMobile(): string {
    const mobile = this.draftState().mobile;
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

  /** Marks the wizard as complete once the application has been saved. */
  markSubmitted(): void {
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
        raw: file,
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
}
