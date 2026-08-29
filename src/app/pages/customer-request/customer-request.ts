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
  hidden,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FORM_STEPS,
  HELP_KIND_OPTIONS,
  HelpKind,
  OTHER_ISSUE_ID,
  REQUEST_VEHICLE_OPTIONS,
  RequestStep,
  RequestVehicleKind,
  SCHEDULE_OPTIONS,
  SCHEDULE_TIME_OPTIONS,
  ScheduleWhen,
  helpKindLabel,
  isDateOnOrAfterToday,
  isServiceForKind,
  kindFromServiceId,
  parseHelpKind,
  scheduleSummary,
  serviceTitle,
  servicesForKind,
  todayIsoDate,
  vehicleLabel,
} from '../../core/customer-request/customer-request.model';
import { CustomerAuthService } from '../../core/customer-auth/customer-auth.service';
import { CustomerRequestService } from '../../core/customer-request/customer-request.service';
import { isValidMobile, normalizeMobile } from '../../core/mechanic-join/mobile';

const OTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-customer-request',
  imports: [FormField, RouterLink],
  templateUrl: './customer-request.html',
  styleUrl: './customer-request.scss',
})
export class CustomerRequest {
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly request = inject(CustomerRequestService);
  private readonly auth = inject(CustomerAuthService);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly draft = this.request.draft;
  protected readonly step = signal<RequestStep>(this.request.submitted() ? 'submitted' : 'kind');
  protected readonly issuedCode = signal('');
  protected readonly choiceError = signal('');

  protected readonly helpKindOptions = HELP_KIND_OPTIONS;
  protected readonly vehicleOptions = REQUEST_VEHICLE_OPTIONS;
  protected readonly scheduleOptions = SCHEDULE_OPTIONS;
  protected readonly scheduleTimeOptions = SCHEDULE_TIME_OPTIONS;
  protected readonly minScheduleDate = todayIsoDate();
  protected readonly otherIssueId = OTHER_ISSUE_ID;
  protected readonly formStepCount = FORM_STEPS.length;
  protected readonly formStepNumber = computed(() => {
    const index = FORM_STEPS.indexOf(this.step());
    return index >= 0 ? index + 1 : this.formStepCount;
  });
  protected readonly progressPercent = computed(
    () => (this.formStepNumber() / this.formStepCount) * 100,
  );
  protected readonly serviceOptions = computed(() => {
    const kind = this.draft().helpKind;
    return kind ? servicesForKind(kind) : [];
  });
  protected readonly otherIssueSelected = computed(
    () => this.draft().serviceId === OTHER_ISSUE_ID,
  );
  protected readonly selectedServiceTitle = computed(() =>
    serviceTitle(this.draft().serviceId, this.draft().helpKind),
  );
  protected readonly helpKindTitle = computed(() => helpKindLabel(this.draft().helpKind));
  protected readonly vehicleTitle = computed(() => vehicleLabel(this.draft().vehicleKind));
  protected readonly isDoorstep = computed(() => this.draft().helpKind === 'doorstep');
  protected readonly pickingCustomTime = computed(
    () => this.isDoorstep() && this.locationModel().scheduleWhen === 'custom',
  );
  protected readonly whenSummary = computed(() =>
    scheduleSummary(
      this.draft().helpKind,
      this.draft().scheduleWhen,
      this.draft().scheduleDate,
      this.draft().scheduleTime,
    ),
  );
  protected readonly maskedMobile = computed(() => this.request.maskedMobile());
  protected readonly contactActionLabel = computed(() => {
    const mobile = this.contactModel().mobile.trim();
    if (mobile && this.isContactVerified(mobile)) {
      return 'Continue to review';
    }
    return 'Send confirmation code';
  });

  protected readonly otherModel = signal({ otherDetails: '' });
  protected readonly vehicleModel = signal({ vehicleDetail: '' });
  protected readonly locationModel = signal({
    city: '',
    location: '',
    notes: '',
    scheduleWhen: '' as ScheduleWhen | '',
    scheduleDate: '',
    scheduleTime: '',
  });
  protected readonly contactModel = signal({ fullName: '', mobile: '' });
  protected readonly otpModel = signal({ code: '' });

  protected readonly otherForm = form(this.otherModel, (fields) => {
    hidden(fields.otherDetails, { when: () => !this.otherIssueSelected() });
    required(fields.otherDetails, {
      message: 'Describe what you need help with.',
      when: () => this.otherIssueSelected(),
    });
    minLength(fields.otherDetails, 3, {
      message: 'Describe what you need help with.',
      when: () => this.otherIssueSelected(),
    });
    maxLength(fields.otherDetails, 400, { message: 'Keep this under 400 characters.' });
  });

  protected readonly vehicleForm = form(this.vehicleModel, (fields) => {
    maxLength(fields.vehicleDetail, 80, { message: 'Keep this under 80 characters.' });
  });

  protected readonly locationForm = form(this.locationModel, (fields) => {
    required(fields.city, { message: 'Enter your city.' });
    minLength(fields.city, 2, { message: 'Enter your city.' });
    maxLength(fields.city, 80, { message: 'Keep the city name under 80 characters.' });
    required(fields.location, { message: 'Describe where you need help.' });
    minLength(fields.location, 3, { message: 'Describe where you need help.' });
    maxLength(fields.location, 200, { message: 'Keep this under 200 characters.' });
    maxLength(fields.notes, 400, { message: 'Keep this under 400 characters.' });
    hidden(fields.scheduleWhen, { when: () => !this.isDoorstep() });
    required(fields.scheduleWhen, {
      message: 'Choose when you want the mechanic to come.',
      when: () => this.isDoorstep(),
    });
    hidden(fields.scheduleDate, { when: () => !this.pickingCustomTime() });
    required(fields.scheduleDate, {
      message: 'Choose a date.',
      when: () => this.pickingCustomTime(),
    });
    validate(fields.scheduleDate, ({ value }) => {
      const date = value().trim();
      if (!this.pickingCustomTime() || !date || isDateOnOrAfterToday(date)) {
        return undefined;
      }
      return { kind: 'minDate', message: 'Choose today or a later date.' };
    });
    hidden(fields.scheduleTime, { when: () => !this.pickingCustomTime() });
    required(fields.scheduleTime, {
      message: 'Choose a starting time.',
      when: () => this.pickingCustomTime(),
    });
  });

  protected readonly contactForm = form(this.contactModel, (fields) => {
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

  constructor() {
    this.prefillFromSession();
    this.applyStartParams();
  }

  protected showError(field: { touched(): boolean; invalid(): boolean }): boolean {
    return field.touched() && field.invalid();
  }

  protected firstError(errors: readonly { readonly message?: string }[]): string {
    return errors[0]?.message ?? 'Check this field.';
  }

  protected selectKind(kind: HelpKind): void {
    const current = this.draft();
    const serviceStillValid = current.serviceId ? isServiceForKind(kind, current.serviceId) : false;
    this.request.patch({
      helpKind: kind,
      serviceId: serviceStillValid ? current.serviceId : '',
      otherDetails: serviceStillValid ? current.otherDetails : '',
      ...(kind === 'roadside'
        ? { scheduleWhen: '', scheduleDate: '', scheduleTime: '' }
        : {}),
    });
    if (!serviceStillValid) {
      this.otherModel.set({ otherDetails: '' });
    }
    if (kind === 'roadside') {
      this.locationModel.update((location) => ({
        ...location,
        scheduleWhen: '',
        scheduleDate: '',
        scheduleTime: '',
      }));
    }
    this.choiceError.set('');
  }

  protected continueKind(event: Event): void {
    event.preventDefault();
    if (!this.draft().helpKind) {
      this.choiceError.set('Choose roadside help or a doorstep service.');
      return;
    }
    this.goTo('service');
    this.focusStepHeading();
  }

  protected selectService(id: string): void {
    this.request.patch({
      serviceId: id,
      otherDetails: id === OTHER_ISSUE_ID ? this.otherModel().otherDetails : '',
    });
    this.choiceError.set('');
  }

  protected async continueService(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.draft().serviceId) {
      this.choiceError.set('Choose the service you need.');
      return;
    }
    const submitted = await submit(this.otherForm, async () => {
      this.request.patch({
        otherDetails: this.otherIssueSelected() ? this.otherModel().otherDetails.trim() : '',
      });
      this.goTo('vehicle');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected selectVehicle(kind: RequestVehicleKind): void {
    this.request.patch({ vehicleKind: kind });
    this.choiceError.set('');
  }

  protected async continueVehicle(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.draft().vehicleKind) {
      this.choiceError.set('Choose whether this is for a car or a bike.');
      return;
    }
    const submitted = await submit(this.vehicleForm, async () => {
      this.request.patch({ vehicleDetail: this.vehicleModel().vehicleDetail.trim() });
      this.goTo('location');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected selectSchedule(when: ScheduleWhen): void {
    this.locationModel.update((current) => ({
      ...current,
      scheduleWhen: when,
      scheduleDate: when === 'custom' ? current.scheduleDate : '',
      scheduleTime: when === 'custom' ? current.scheduleTime : '',
    }));
  }

  protected async saveLocation(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.locationForm, async () => {
      const value = this.locationModel();
      const doorstep = this.isDoorstep();
      this.request.patch({
        city: value.city.trim(),
        location: value.location.trim(),
        notes: value.notes.trim(),
        scheduleWhen: doorstep ? value.scheduleWhen : '',
        scheduleDate: doorstep && value.scheduleWhen === 'custom' ? value.scheduleDate : '',
        scheduleTime: doorstep && value.scheduleWhen === 'custom' ? value.scheduleTime : '',
      });
      this.goTo('contact');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected async saveContact(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.contactForm, async () => {
      const value = this.contactModel();
      const fullName = value.fullName.trim();
      const mobile = value.mobile.trim();

      this.request.patch({ fullName });

      if (this.isContactVerified(mobile)) {
        this.request.patch({ mobile: normalizeMobile(mobile) });
        this.goTo('review');
        return undefined;
      }

      const challenge = this.request.requestOtp(mobile);
      this.issuedCode.set(challenge.code);
      this.otpModel.set({ code: '' });
      this.goTo('otp');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected async confirmCode(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.otpForm, async () => {
      const result = this.request.verifyOtp(String(this.otpForm.code().controlValue()));
      if (result === 'ok') {
        this.goTo('review');
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
    const mobile = String(this.contactForm.mobile().controlValue());
    const challenge = this.request.requestOtp(mobile);
    this.issuedCode.set(challenge.code);
    this.otpModel.set({ code: '' });
  }

  protected changeNumber(): void {
    this.goTo('contact');
    this.otpModel.set({ code: '' });
    this.issuedCode.set('');
    this.focusStepHeading();
  }

  protected submitRequest(): void {
    this.request.submitRequest();
    this.goTo('submitted');
    this.focusStepHeading();
  }

  protected startAnother(): void {
    this.request.reset();
    this.otherModel.set({ otherDetails: '' });
    this.vehicleModel.set({ vehicleDetail: '' });
    this.locationModel.set({
      city: '',
      location: '',
      notes: '',
      scheduleWhen: '',
      scheduleDate: '',
      scheduleTime: '',
    });
    this.otpModel.set({ code: '' });
    this.issuedCode.set('');
    this.choiceError.set('');
    this.prefillFromSession();
    this.contactModel.set({ fullName: this.draft().fullName, mobile: this.draft().mobile });
    this.step.set('kind');
    void this.router.navigateByUrl('/request', { replaceUrl: true });
    this.focusStepHeading();
  }

  protected back(): void {
    const index = FORM_STEPS.indexOf(this.step());
    if (index <= 0) {
      return;
    }
    this.goTo(FORM_STEPS[index - 1]);
    this.focusStepHeading();
  }

  protected edit(step: RequestStep): void {
    this.goTo(step);
    this.focusStepHeading();
  }

  private prefillFromSession(): void {
    const session = this.auth.session();
    if (!session || this.request.submitted()) {
      return;
    }

    const current = this.draft();
    this.request.patch({
      fullName: current.fullName || session.fullName,
      mobile: current.mobile || session.mobile,
    });
  }

  private isContactVerified(mobile: string): boolean {
    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      return false;
    }
    if (this.auth.matchesVerifiedMobile(normalized)) {
      return true;
    }
    return this.draft().mobileVerified && this.draft().mobile === normalized;
  }

  private applyStartParams(): void {
    if (this.request.submitted()) {
      this.step.set('submitted');
      return;
    }

    const params = this.route.snapshot.queryParamMap;
    const serviceId = params.get('service')?.trim() ?? '';
    const kind = parseHelpKind(params.get('kind')) || kindFromServiceId(serviceId);
    if (!kind) {
      return;
    }

    const validService = serviceId && isServiceForKind(kind, serviceId) ? serviceId : '';
    this.request.patch({
      helpKind: kind,
      serviceId: validService,
      otherDetails: validService === OTHER_ISSUE_ID ? this.draft().otherDetails : '',
    });
    this.otherModel.set({
      otherDetails: validService === OTHER_ISSUE_ID ? this.draft().otherDetails : '',
    });

    if (validService === OTHER_ISSUE_ID) {
      this.step.set('service');
      return;
    }
    if (validService) {
      this.step.set('vehicle');
      return;
    }
    this.step.set('service');
  }

  private goTo(step: RequestStep): void {
    if (this.request.submitted()) {
      this.step.set('submitted');
      this.choiceError.set('');
      return;
    }

    if (step === 'review' && !this.isContactVerified(this.draft().mobile)) {
      this.step.set('contact');
      this.choiceError.set('');
      this.hydrate('contact');
      return;
    }

    this.hydrate(step);
    this.choiceError.set('');
    this.step.set(step);
  }

  private hydrate(step: RequestStep): void {
    const draft = this.draft();
    switch (step) {
      case 'service':
        this.otherModel.set({ otherDetails: draft.otherDetails });
        break;
      case 'vehicle':
        this.vehicleModel.set({ vehicleDetail: draft.vehicleDetail });
        break;
      case 'location':
        this.locationModel.set({
          city: draft.city,
          location: draft.location,
          notes: draft.notes,
          scheduleWhen: draft.scheduleWhen,
          scheduleDate: draft.scheduleDate,
          scheduleTime: draft.scheduleTime,
        });
        break;
      case 'contact':
        this.contactModel.set({ fullName: draft.fullName, mobile: draft.mobile });
        break;
      default:
        break;
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
