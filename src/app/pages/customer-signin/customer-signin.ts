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
import { CustomerAuthService } from '../../core/customer-auth/customer-auth.service';
import { isValidMobile } from '../../core/mechanic-join/mobile';

const OTP_PATTERN = /^\d{6}$/;

type SignInStep = 'details' | 'otp';

@Component({
  selector: 'app-customer-signin',
  imports: [FormField],
  templateUrl: './customer-signin.html',
  styleUrl: './customer-signin.scss',
})
export class CustomerSignin {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly auth = inject(CustomerAuthService);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly step = signal<SignInStep>('details');
  protected readonly issuedCode = signal('');
  protected readonly maskedMobile = computed(() => this.auth.maskedMobile());

  protected readonly detailsModel = signal({ fullName: '', mobile: '' });
  protected readonly otpModel = signal({ code: '' });

  protected readonly detailsForm = form(this.detailsModel, (fields) => {
    required(fields.fullName, { message: 'Enter your name.' });
    minLength(fields.fullName, 2, { message: 'Enter your name.' });
    maxLength(fields.fullName, 80, { message: 'Keep your name under 80 characters.' });
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

  protected showError(field: { touched(): boolean; invalid(): boolean }): boolean {
    return field.touched() && field.invalid();
  }

  protected firstError(errors: readonly { readonly message?: string }[]): string {
    return errors[0]?.message ?? 'Check this field.';
  }

  protected async continueWithMobile(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.detailsForm, async () => {
      const value = this.detailsModel();
      const challenge = this.auth.requestOtp(value.fullName.trim(), value.mobile.trim());
      this.issuedCode.set(challenge.code);
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
      const result = this.auth.verifyOtp(String(this.otpForm.code().controlValue()));
      if (result === 'ok') {
        void this.router.navigateByUrl('/request');
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
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected resendCode(): void {
    const value = this.detailsModel();
    const challenge = this.auth.requestOtp(value.fullName.trim(), value.mobile.trim());
    this.issuedCode.set(challenge.code);
    this.otpModel.set({ code: '' });
  }

  protected changeNumber(): void {
    this.step.set('details');
    this.otpModel.set({ code: '' });
    this.issuedCode.set('');
    this.focusStepHeading();
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
