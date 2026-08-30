import { inject, Service, signal } from '@angular/core';
import { JobService } from '../jobs/jobs.service';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import { CustomerRequestDraft, emptyRequestDraft } from './customer-request.model';

@Service()
export class CustomerRequestService {
  private readonly jobs = inject(JobService);
  private readonly draftState = signal<CustomerRequestDraft>(emptyRequestDraft());
  private readonly submittedState = signal(false);

  readonly draft = this.draftState.asReadonly();
  readonly submitted = this.submittedState.asReadonly();

  patch(partial: Partial<CustomerRequestDraft>): void {
    this.draftState.update((current) => ({ ...current, ...partial }));
  }

  maskedMobile(): string {
    const mobile = this.draftState().mobile;
    return mobile ? maskMobile(mobile) : '';
  }

  async submitRequest(): Promise<'ok' | 'error'> {
    const result = await this.jobs.createFromDraft(this.draftState());
    if (!result.ok) {
      return 'error';
    }

    this.draftState.update((draft) => ({
      ...draft,
      mobile: normalizeMobile(draft.mobile),
      mobileVerified: true,
      reference: result.job.reference,
    }));
    this.submittedState.set(true);
    return 'ok';
  }

  reset(): void {
    this.draftState.set(emptyRequestDraft());
    this.submittedState.set(false);
  }
}
