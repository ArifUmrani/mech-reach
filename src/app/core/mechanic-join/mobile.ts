const DIGITS_ONLY = /\D/g;

export function normalizeMobile(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(DIGITS_ONLY, '');
  return hasPlus ? `+${digits}` : digits;
}

export function isValidMobile(value: string): boolean {
  const digits = value.replace(DIGITS_ONLY, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function maskMobile(value: string): string {
  const digits = value.replace(DIGITS_ONLY, '');
  if (digits.length < 4) {
    return value;
  }

  const visible = digits.slice(-4);
  return `•••• ${visible}`;
}
