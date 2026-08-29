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
  email,
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
import { RouterLink } from '@angular/router';
import {
  COVERAGE_OPTIONS,
  CoverageKind,
  FORM_STEPS,
  HoursKind,
  JoinStep,
  OTHER_SERVICE_ID,
  OTHER_SERVICE_TITLE,
  PRACTICE_OPTIONS,
  PracticeKind,
  VEHICLE_OPTIONS,
  VehicleKind,
  WEEKDAYS,
  WeekdayId,
  weekdayLabel,
} from '../../core/mechanic-join/mechanic-join.model';
import {
  CUSTOM_TIME_OPTIONS,
  HOURS_OPTIONS,
  TWELVE_HOUR_STARTS,
  allDaysAriaChecked,
  allDaysSelected,
  daysSummary,
  hoursSummary,
  isValidTimeRange,
  nextAllDaysSelection,
  resolveHours,
  someDaysSelected,
} from '../../core/mechanic-join/availability';
import { MechanicJoinService } from '../../core/mechanic-join/mechanic-join.service';
import { isValidMobile } from '../../core/mechanic-join/mobile';
import { SERVICE_CATEGORIES } from '../landing/landing.content';

const OTP_PATTERN = /^\d{6}$/;
const YEARS_PATTERN = /^(?:[0-9]|[1-4][0-9]|50)$/;
const KM_PATTERN = /^(?:[1-9]|[1-9][0-9]|1[0-9]{2}|200)$/;

@Component({
  selector: 'app-mechanic-join',
  imports: [FormField, RouterLink],
  templateUrl: './mechanic-join.html',
  styleUrl: './mechanic-join.scss',
})
export class MechanicJoin {
  private readonly injector = inject(Injector);
  private readonly join = inject(MechanicJoinService);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly draft = this.join.draft;
  protected readonly step = signal<JoinStep>(this.join.submitted() ? 'submitted' : 'mobile');
  protected readonly issuedCode = signal('');
  protected readonly choiceError = signal('');
  protected readonly uploadError = signal('');

  protected readonly practiceOptions = PRACTICE_OPTIONS;
  protected readonly vehicleOptions = VEHICLE_OPTIONS;
  protected readonly coverageOptions = COVERAGE_OPTIONS;
  protected readonly hoursOptions = HOURS_OPTIONS;
  protected readonly twelveHourStarts = TWELVE_HOUR_STARTS;
  protected readonly customTimeOptions = CUSTOM_TIME_OPTIONS;
  protected readonly weekdays = WEEKDAYS;
  protected readonly otherServiceId = OTHER_SERVICE_ID;
  protected readonly serviceCategories = SERVICE_CATEGORIES.map((category) => ({
    ...category,
    services: category.services.filter((service) => service.id !== 'other-issue'),
  }));
  protected readonly formStepCount = FORM_STEPS.length;
  protected readonly formStepNumber = computed(() => {
    const index = FORM_STEPS.indexOf(this.step());
    return index >= 0 ? index + 1 : this.formStepCount;
  });
  protected readonly progressPercent = computed(
    () => (this.formStepNumber() / this.formStepCount) * 100,
  );

  protected readonly selectedServiceTitles = computed(() =>
    this.draft().serviceIds.map((id) => this.serviceTitle(id)),
  );
  protected readonly otherServicesSelected = computed(() =>
    this.draft().serviceIds.includes(OTHER_SERVICE_ID),
  );

  protected readonly selectedDayLabels = computed(() =>
    this.draft().availableDays.map((id) => weekdayLabel(id)),
  );
  protected readonly allDaysChecked = computed(() => allDaysSelected(this.draft().availableDays));
  protected readonly someDaysChecked = computed(() => someDaysSelected(this.draft().availableDays));
  protected readonly allDaysAria = computed(() => allDaysAriaChecked(this.draft().availableDays));
  protected readonly schedulePreview = computed(() => {
    const draft = this.draft();
    const model = this.availabilityModel();
    const kind = draft.hoursKind;
    const times = kind
      ? resolveHours(kind, model.twelveHourStart, model.availableFrom, model.availableTo)
      : { from: '', to: '' };
    const customIncomplete =
      kind === 'custom' && (!times.from || !times.to || !isValidTimeRange(times.from, times.to));
    return {
      days: daysSummary(draft.availableDays),
      hours: customIncomplete ? '' : hoursSummary(kind, times.from, times.to),
    };
  });
  protected readonly maskedMobile = computed(() => this.join.maskedMobile());

  protected readonly mobileModel = signal({ mobile: '' });
  protected readonly otpModel = signal({ code: '' });
  protected readonly profileModel = signal({ fullName: '', email: '' });
  protected readonly experienceModel = signal({ workshopName: '', yearsExperience: '' });
  protected readonly locationModel = signal({ city: '', serviceAreas: '', travelKm: '' });
  protected readonly availabilityModel = signal({
    twelveHourStart: '',
    availableFrom: '',
    availableTo: '',
  });
  protected readonly servicesModel = signal({ otherServices: '' });

  protected readonly mobileForm = form(this.mobileModel, (fields) => {
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

  protected readonly profileForm = form(this.profileModel, (fields) => {
    required(fields.fullName, { message: 'Enter your full name.' });
    minLength(fields.fullName, 2, { message: 'Enter your full name.' });
    maxLength(fields.fullName, 80, { message: 'Keep your name under 80 characters.' });
    email(fields.email, {
      message: 'Enter a valid email, or leave this blank.',
      when: ({ value }) => value().trim().length > 0,
    });
  });

  protected readonly experienceForm = form(this.experienceModel, (fields) => {
    hidden(fields.workshopName, { when: () => this.draft().practiceKind !== 'workshop' });
    required(fields.workshopName, {
      message: 'Enter the workshop name.',
      when: () => this.draft().practiceKind === 'workshop',
    });
    maxLength(fields.workshopName, 80, { message: 'Keep the workshop name under 80 characters.' });
    required(fields.yearsExperience, { message: 'Enter years of experience.' });
    pattern(fields.yearsExperience, YEARS_PATTERN, {
      message: 'Enter years of experience from 0 to 50.',
    });
  });

  protected readonly servicesForm = form(this.servicesModel, (fields) => {
    hidden(fields.otherServices, { when: () => !this.otherServicesSelected() });
    required(fields.otherServices, {
      message: 'Describe the other skills you can offer.',
      when: () => this.otherServicesSelected(),
    });
    minLength(fields.otherServices, 3, {
      message: 'Describe the other skills you can offer.',
      when: () => this.otherServicesSelected(),
    });
    maxLength(fields.otherServices, 400, { message: 'Keep this under 400 characters.' });
  });

  protected readonly locationForm = form(this.locationModel, (fields) => {
    required(fields.city, { message: 'Enter your city.' });
    minLength(fields.city, 2, { message: 'Enter your city.' });
    maxLength(fields.city, 80, { message: 'Keep the city name under 80 characters.' });
    required(fields.serviceAreas, { message: 'Describe the areas you can cover.' });
    minLength(fields.serviceAreas, 3, { message: 'Describe the areas you can cover.' });
    maxLength(fields.serviceAreas, 400, { message: 'Keep this under 400 characters.' });
    required(fields.travelKm, { message: 'Enter how far you can travel.' });
    pattern(fields.travelKm, KM_PATTERN, { message: 'Enter a distance from 1 to 200 km.' });
  });

  protected readonly availabilityForm = form(this.availabilityModel, (fields) => {
    hidden(fields.twelveHourStart, { when: () => this.draft().hoursKind !== 'twelve-hour' });
    required(fields.twelveHourStart, {
      message: 'Choose when your 12-hour window starts.',
      when: () => this.draft().hoursKind === 'twelve-hour',
    });
    hidden(fields.availableFrom, { when: () => this.draft().hoursKind !== 'custom' });
    hidden(fields.availableTo, { when: () => this.draft().hoursKind !== 'custom' });
    required(fields.availableFrom, {
      message: 'Choose a start time.',
      when: () => this.draft().hoursKind === 'custom',
    });
    required(fields.availableTo, {
      message: 'Choose an end time.',
      when: () => this.draft().hoursKind === 'custom',
    });
    validate(fields.availableTo, ({ valueOf }) => {
      if (this.draft().hoursKind !== 'custom') {
        return undefined;
      }
      const from = String(valueOf(fields.availableFrom));
      const to = String(valueOf(fields.availableTo));
      if (from && to && !isValidTimeRange(from, to)) {
        return { kind: 'range', message: 'End time must be after start time on the same day.' };
      }
      return undefined;
    });
  });

  protected showError(field: { touched(): boolean; invalid(): boolean }): boolean {
    return field.touched() && field.invalid();
  }

  protected firstError(errors: readonly { readonly message?: string }[]): string {
    return errors[0]?.message ?? 'Check this field.';
  }

  protected fileSizeLabel(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) {
      return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
    }
    return `${(kilobytes / 1024).toFixed(1)} MB`;
  }

  protected serviceTitle(id: string): string {
    if (id === OTHER_SERVICE_ID) {
      return OTHER_SERVICE_TITLE;
    }
    for (const category of SERVICE_CATEGORIES) {
      const match = category.services.find((service) => service.id === id);
      if (match) {
        return match.title;
      }
    }
    return id;
  }

  protected practiceLabel(): string {
    return (
      PRACTICE_OPTIONS.find((option) => option.value === this.draft().practiceKind)?.title ?? ''
    );
  }

  protected vehicleLabel(): string {
    return VEHICLE_OPTIONS.find((option) => option.value === this.draft().vehicleKind)?.title ?? '';
  }

  protected coverageLabel(): string {
    return (
      COVERAGE_OPTIONS.find((option) => option.value === this.draft().coverageKind)?.title ?? ''
    );
  }

  protected yearsLabel(): string {
    const years = this.draft().yearsExperience;
    return years === '1' ? '1 year' : `${years} years`;
  }

  protected hoursLabel(): string {
    const draft = this.draft();
    return hoursSummary(draft.hoursKind, draft.availableFrom, draft.availableTo);
  }

  protected isSelectedService(id: string): boolean {
    return this.draft().serviceIds.includes(id);
  }

  protected isSelectedDay(id: WeekdayId): boolean {
    return this.draft().availableDays.includes(id);
  }

  protected async sendCode(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.mobileForm, async () => {
      const mobile = String(this.mobileForm.mobile().controlValue()).trim();
      const challenge = this.join.requestOtp(mobile);
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
      const result = this.join.verifyOtp(String(this.otpForm.code().controlValue()));
      if (result === 'ok') {
        this.goTo('profile');
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
    const mobile = String(this.mobileForm.mobile().controlValue());
    const challenge = this.join.requestOtp(mobile);
    this.issuedCode.set(challenge.code);
    this.otpModel.set({ code: '' });
  }

  protected changeNumber(): void {
    this.goTo('mobile');
    this.otpModel.set({ code: '' });
    this.issuedCode.set('');
    this.focusStepHeading();
  }

  protected async saveProfile(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.profileForm, async () => {
      const value = this.profileModel();
      this.join.patch({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
      });
      this.goTo('practice');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const result = this.join.replacePhoto(file);
    this.uploadError.set(result.ok ? '' : result.message);
  }

  protected clearPhoto(): void {
    this.join.clearPhoto();
    this.uploadError.set('');
  }

  protected selectPractice(kind: PracticeKind): void {
    this.join.patch({ practiceKind: kind });
    this.choiceError.set('');
  }

  protected continuePractice(event: Event): void {
    event.preventDefault();
    if (!this.draft().practiceKind) {
      this.choiceError.set('Choose independent mechanic or workshop.');
      return;
    }
    this.goTo('experience');
    this.focusStepHeading();
  }

  protected async saveExperience(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.experienceForm, async () => {
      const value = this.experienceModel();
      this.join.patch({
        workshopName:
          this.draft().practiceKind === 'workshop' ? value.workshopName.trim() : '',
        yearsExperience: value.yearsExperience.trim(),
      });
      this.goTo('vehicles');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected selectVehicle(kind: VehicleKind): void {
    this.join.patch({ vehicleKind: kind });
    this.choiceError.set('');
  }

  protected continueVehicles(event: Event): void {
    event.preventDefault();
    if (!this.draft().vehicleKind) {
      this.choiceError.set('Choose cars, bikes, or both.');
      return;
    }
    this.goTo('services');
    this.focusStepHeading();
  }

  protected toggleService(id: string): void {
    const current = this.draft().serviceIds;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    this.join.patch({ serviceIds: next });
    this.choiceError.set('');
  }

  protected async continueServices(event: Event): Promise<void> {
    event.preventDefault();
    if (this.draft().serviceIds.length === 0) {
      this.choiceError.set('Choose at least one service you can offer.');
      return;
    }
    const submitted = await submit(this.servicesForm, async () => {
      this.join.patch({
        otherServices: this.otherServicesSelected()
          ? this.servicesModel().otherServices.trim()
          : '',
      });
      this.goTo('coverage');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected selectCoverage(kind: CoverageKind): void {
    this.join.patch({ coverageKind: kind });
    this.choiceError.set('');
  }

  protected continueCoverage(event: Event): void {
    event.preventDefault();
    if (!this.draft().coverageKind) {
      this.choiceError.set('Choose roadside, doorstep, or both.');
      return;
    }
    this.goTo('location');
    this.focusStepHeading();
  }

  protected async saveLocation(event: Event): Promise<void> {
    event.preventDefault();
    const submitted = await submit(this.locationForm, async () => {
      const value = this.locationModel();
      this.join.patch({
        city: value.city.trim(),
        serviceAreas: value.serviceAreas.trim(),
        travelKm: value.travelKm.trim(),
      });
      this.goTo('availability');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected toggleAllDays(): void {
    this.join.patch({ availableDays: nextAllDaysSelection(this.draft().availableDays) });
    this.choiceError.set('');
  }

  protected toggleDay(id: WeekdayId): void {
    const current = this.draft().availableDays;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    this.join.patch({ availableDays: next });
    this.choiceError.set('');
  }

  protected selectHoursKind(kind: HoursKind): void {
    const current = this.availabilityModel();
    const times = resolveHours(kind, current.twelveHourStart, current.availableFrom, current.availableTo);
    this.join.patch({
      hoursKind: kind,
      availableFrom: times.from,
      availableTo: times.to,
    });
    this.choiceError.set('');
  }

  protected selectTwelveHourStart(start: string): void {
    const times = resolveHours('twelve-hour', start, '', '');
    this.availabilityModel.update((current) => ({ ...current, twelveHourStart: start }));
    this.join.patch({
      hoursKind: 'twelve-hour',
      availableFrom: times.from,
      availableTo: times.to,
    });
    this.choiceError.set('');
  }

  protected async saveAvailability(event: Event): Promise<void> {
    event.preventDefault();
    if (this.draft().availableDays.length === 0) {
      this.choiceError.set('Choose at least one day you can take jobs.');
      return;
    }
    if (!this.draft().hoursKind) {
      this.choiceError.set('Choose when you are available.');
      return;
    }
    const submitted = await submit(this.availabilityForm, async () => {
      const value = this.availabilityModel();
      const kind = this.draft().hoursKind;
      if (kind === '') {
        return undefined;
      }
      const times = resolveHours(kind, value.twelveHourStart, value.availableFrom, value.availableTo);
      this.join.patch({
        hoursKind: kind,
        availableFrom: times.from,
        availableTo: times.to,
      });
      this.goTo('identity');
      return undefined;
    });
    if (submitted) {
      this.focusStepHeading();
    }
  }

  protected onIdentitySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const result = this.join.replaceIdentity(file);
    this.uploadError.set(result.ok ? '' : result.message);
  }

  protected continueIdentity(event: Event): void {
    event.preventDefault();
    if (!this.draft().identityDocument) {
      this.uploadError.set('Upload a national identity card or government-issued ID.');
      return;
    }
    this.goTo('terms');
    this.focusStepHeading();
  }

  protected setTermsAccepted(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.join.patch({ termsAccepted: input.checked });
    this.choiceError.set('');
  }

  protected continueTerms(event: Event): void {
    event.preventDefault();
    if (!this.draft().termsAccepted) {
      this.choiceError.set('Accept the terms to continue.');
      return;
    }
    this.goTo('review');
    this.focusStepHeading();
  }

  protected submitApplication(): void {
    this.join.submitApplication();
    this.goTo('submitted');
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

  protected edit(step: JoinStep): void {
    this.goTo(step);
    this.focusStepHeading();
  }

  private goTo(step: JoinStep): void {
    if (this.join.submitted()) {
      this.step.set('submitted');
      this.choiceError.set('');
      this.uploadError.set('');
      return;
    }

    if (step !== 'mobile' && step !== 'otp' && !this.draft().mobileVerified) {
      this.step.set('mobile');
      this.choiceError.set('');
      this.uploadError.set('');
      return;
    }

    this.hydrate(step);
    this.choiceError.set('');
    this.uploadError.set('');
    this.step.set(step);
  }

  private hydrate(step: JoinStep): void {
    const draft = this.draft();
    switch (step) {
      case 'profile':
        this.profileModel.set({ fullName: draft.fullName, email: draft.email });
        break;
      case 'experience':
        this.experienceModel.set({
          workshopName: draft.workshopName,
          yearsExperience: draft.yearsExperience,
        });
        break;
      case 'services':
        this.servicesModel.set({ otherServices: draft.otherServices });
        break;
      case 'location':
        this.locationModel.set({
          city: draft.city,
          serviceAreas: draft.serviceAreas,
          travelKm: draft.travelKm,
        });
        break;
      case 'availability':
        this.availabilityModel.set({
          twelveHourStart: draft.hoursKind === 'twelve-hour' ? draft.availableFrom : '',
          availableFrom: draft.hoursKind === 'custom' ? draft.availableFrom : '',
          availableTo: draft.hoursKind === 'custom' ? draft.availableTo : '',
        });
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
