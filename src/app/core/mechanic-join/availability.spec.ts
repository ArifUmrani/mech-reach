import {
  ALL_WEEKDAY_IDS,
  allDaysAriaChecked,
  allDaysSelected,
  addHours,
  formatTimeLabel,
  hoursSummary,
  isValidTimeRange,
  nextAllDaysSelection,
  resolveHours,
  someDaysSelected,
} from './availability';

describe('availability helpers', () => {
  it('treats a full week as all days and a partial week as mixed', () => {
    expect(allDaysSelected(ALL_WEEKDAY_IDS)).toBe(true);
    expect(someDaysSelected(['monday', 'tuesday'])).toBe(true);
    expect(allDaysAriaChecked(['monday'])).toBe('mixed');
    expect(allDaysAriaChecked([])).toBe('false');
    expect(allDaysAriaChecked(ALL_WEEKDAY_IDS)).toBe('true');
  });

  it('selects every day from an empty or partial set, and clears a full set', () => {
    expect(nextAllDaysSelection([])).toEqual(ALL_WEEKDAY_IDS);
    expect(nextAllDaysSelection(['friday'])).toEqual(ALL_WEEKDAY_IDS);
    expect(nextAllDaysSelection(ALL_WEEKDAY_IDS)).toEqual([]);
  });

  it('adds twelve hours and wraps past midnight', () => {
    expect(addHours('08:00', 12)).toBe('20:00');
    expect(addHours('20:00', 12)).toBe('08:00');
  });

  it('formats times in 12-hour labels and summarizes hour presets', () => {
    expect(formatTimeLabel('08:00')).toBe('8:00 AM');
    expect(formatTimeLabel('20:00')).toBe('8:00 PM');
    expect(hoursSummary('all-day', '00:00', '23:59')).toBe('Available 24 hours');
    expect(hoursSummary('daytime', '08:00', '20:00')).toBe('8:00 AM – 8:00 PM');
    expect(hoursSummary('twelve-hour', '20:00', '08:00')).toBe('8:00 PM – 8:00 AM');
  });

  it('requires custom end time to be later the same day', () => {
    expect(isValidTimeRange('09:00', '17:00')).toBe(true);
    expect(isValidTimeRange('17:00', '09:00')).toBe(false);
    expect(isValidTimeRange('09:00', '09:00')).toBe(false);
  });

  it('resolves stored hours for each preset', () => {
    expect(resolveHours('all-day', '', '', '')).toEqual({ from: '00:00', to: '23:59' });
    expect(resolveHours('daytime', '', '', '')).toEqual({ from: '08:00', to: '20:00' });
    expect(resolveHours('twelve-hour', '06:00', '', '')).toEqual({ from: '06:00', to: '18:00' });
    expect(resolveHours('custom', '', '10:00', '16:00')).toEqual({ from: '10:00', to: '16:00' });
  });
});
