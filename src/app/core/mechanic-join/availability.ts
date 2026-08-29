import { ChoiceOption, HoursKind, WEEKDAYS, WeekdayId, weekdayLabel } from './mechanic-join.model';

export const ALL_WEEKDAY_IDS: readonly WeekdayId[] = WEEKDAYS.map((day) => day.id);

export const DAYTIME_FROM = '08:00';
export const DAYTIME_TO = '20:00';
export const ALL_DAY_FROM = '00:00';
export const ALL_DAY_TO = '23:59';

export const HOURS_OPTIONS: readonly ChoiceOption<HoursKind>[] = [
  {
    value: 'all-day',
    title: 'Available 24 hours',
    description: 'I can take jobs at any time.',
  },
  {
    value: 'twelve-hour',
    title: '12-hour availability',
    description: 'Choose when a 12-hour window starts.',
  },
  {
    value: 'daytime',
    title: '8:00 AM–8:00 PM',
    description: 'A daytime window from morning to evening.',
  },
  {
    value: 'custom',
    title: 'Custom hours',
    description: 'Set your own start and end times.',
  },
];

export const TWELVE_HOUR_STARTS: readonly { value: string; label: string }[] = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
];

export const CUSTOM_TIME_OPTIONS: readonly { value: string; label: string }[] =
  buildCustomTimeOptions();

export function allDaysSelected(days: readonly WeekdayId[]): boolean {
  return days.length === ALL_WEEKDAY_IDS.length && ALL_WEEKDAY_IDS.every((id) => days.includes(id));
}

export function someDaysSelected(days: readonly WeekdayId[]): boolean {
  return days.length > 0 && !allDaysSelected(days);
}

export function nextAllDaysSelection(days: readonly WeekdayId[]): readonly WeekdayId[] {
  return allDaysSelected(days) ? [] : ALL_WEEKDAY_IDS;
}

export function allDaysAriaChecked(days: readonly WeekdayId[]): 'true' | 'false' | 'mixed' {
  if (allDaysSelected(days)) {
    return 'true';
  }
  if (someDaysSelected(days)) {
    return 'mixed';
  }
  return 'false';
}

export function addHours(hhmm: string, hours: number): string {
  const minutes = parseMinutes(hhmm);
  if (minutes === null) {
    return hhmm;
  }
  const next = (minutes + hours * 60) % (24 * 60);
  return formatMinutes(next);
}

export function isValidTimeRange(from: string, to: string): boolean {
  const start = parseMinutes(from);
  const end = parseMinutes(to);
  return start !== null && end !== null && end > start;
}

export function formatTimeLabel(hhmm: string): string {
  const minutes = parseMinutes(hhmm);
  if (minutes === null) {
    return hhmm;
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function hoursSummary(kind: HoursKind | '', from: string, to: string): string {
  switch (kind) {
    case 'all-day':
      return 'Available 24 hours';
    case 'daytime':
      return '8:00 AM – 8:00 PM';
    case 'twelve-hour':
    case 'custom':
      if (!from || !to) {
        return '';
      }
      return `${formatTimeLabel(from)} – ${formatTimeLabel(to)}`;
    default:
      return '';
  }
}

export function resolveHours(
  kind: HoursKind,
  twelveHourStart: string,
  customFrom: string,
  customTo: string,
): { readonly from: string; readonly to: string } {
  switch (kind) {
    case 'all-day':
      return { from: ALL_DAY_FROM, to: ALL_DAY_TO };
    case 'daytime':
      return { from: DAYTIME_FROM, to: DAYTIME_TO };
    case 'twelve-hour':
      return { from: twelveHourStart, to: twelveHourStart ? addHours(twelveHourStart, 12) : '' };
    case 'custom':
      return { from: customFrom, to: customTo };
  }
}

export function daysSummary(days: readonly WeekdayId[]): string {
  if (allDaysSelected(days)) {
    return 'Every day';
  }
  return days.map((id) => weekdayLabel(id)).join(', ');
}

function parseMinutes(hhmm: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutes(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildCustomTimeOptions(): readonly { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const value = formatMinutes(minutes);
    options.push({ value, label: formatTimeLabel(value) });
  }
  options.push({ value: '23:59', label: formatTimeLabel('23:59') });
  return options;
}
