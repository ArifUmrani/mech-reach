import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth/admin-auth.service';
import { isValidMobile } from '../../core/mechanic-join/mobile';
import { developmentOtpHint } from '../../core/supabase/supabase-client';

const OTP_PATTERN = /^\d{6}$/;

type AdminSignInStep = 'details' | 'otp' | 'forbidden';

@Component({
  selector: 'app-admin-signin',
  imports: [FormField],
  templateUrl: './admin-signin.html',
  styleUrl: './admin-signin.scss',
})
export class AdminSignin {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly step = signal<AdminSignInStep>('details');
  protected readonly otpHint = developmentOtpHint();
  protected readonly maskedMobile = computed(() => this.auth.maskedMobile());

  protected readonly detailsModel = signal({ mobile: '' });
  protected readonly otpModel = signal({ code: '' });

  protected readonly detailsForm = form(this.detailsModel, (fields) => {
    required(fields.mobile, { message: 'Enter your mobile number.' });
    validate(fields.mobile, ({ value }) => {
      const mobile = value().trim();
      if (!mobile || isValidMobile(mobile)) {
        return undefined;
      }
      return { kind: 'mobile', message: 'Enter a valid mobile number with 10 to 15 digits.' };
    });
  });

  protected readonly otpForm = form(this.otpModel, (fields) => {
    required(fields.code, { message: 'Enter the 6-digit confirmation code.' });
    minLength(fields.code, 6, { message: 'Enter the 6-digit confirmation code.' });
    maxLength(fields.code, 6, { message: 'Enter the 6-digit confirmation code.' });
    pattern(fields.code, OTP_PATTERN, { message: 'Enter the 6-digit confirmation code.' });
  });

  constructor() {
    void this.rejectNonAdminSession();
  }

  protected showError(field: { touched(): boolean; invalid(): boolean }): boolean {
    return field.touched() && field.invalid();
  }

  protected firstError(errors: readonly { readonly message?: string }[]): string {
    return errors[0]?.message ?? 'Check this field.';
  }

  protected async continueWithMobile(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.detailsForm, async () => {
      const result = await this.auth.requestOtp(this.detailsModel().mobile.trim());
      if (!result.ok) {
        return [{ fieldTree: this.detailsForm.mobile, kind: 'otp', message: result.message }];
      }
      this.otpModel.set({ code: '' });
      this.step.set('otp');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected async confirmCode(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.otpForm, async () => {
      const result = await this.auth.verifyOtp(String(this.otpForm.code().controlValue()));
      if (result === 'ok') {
        void this.router.navigateByUrl('/admin/dashboard');
        return undefined;
      }
      if (result === 'forbidden') {
        this.step.set('forbidden');
        return undefined;
      }
      const message =
        result === 'expired'
          ? 'This code has expired. Request a new one.'
          : result === 'missing'
            ? 'Request a confirmation code first.'
            : 'That code does not match. Try again.';
      return [{ fieldTree: this.otpForm.code, kind: 'otp', message }];
    });
    if (submitted || this.step() === 'forbidden') {
      this.focusStepHeading();
    }
  }

  protected async resendCode(): Promise<void> {
    await this.auth.requestOtp(this.detailsModel().mobile.trim());
    this.otpModel.set({ code: '' });
  }

  protected changeNumber(): void {
    this.step.set('details');
    this.otpModel.set({ code: '' });
    this.focusStepHeading();
  }

  protected async tryAgain(): Promise<void> {
    await this.auth.signOut();
    this.step.set('details');
    this.otpModel.set({ code: '' });
    this.focusStepHeading();
  }

  private async rejectNonAdminSession(): Promise<void> {
    await this.auth.whenReady();
    if (this.auth.signedIn() && !this.auth.isAdmin()) {
      this.step.set('forbidden');
      await this.auth.signOut();
      this.focusStepHeading();
    }
  }

  private focusStepHeading(): void {
    afterNextRender(
      () => {
        this.stepHeading()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}
