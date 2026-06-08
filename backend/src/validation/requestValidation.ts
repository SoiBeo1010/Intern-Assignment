export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function parseRegistrationNumber(value: unknown): string {
  if (typeof value !== 'string') {
    throw new RequestValidationError('Registration number is required.');
  }

  const registrationNumber = value.trim();

  // Accept digit-only registration numbers and normalize 7-digit input to the
  // stored 8-digit form by left-padding the omitted leading zero.
  if (!/^\d{7,8}$/.test(registrationNumber)) {
    throw new RequestValidationError('Registration number must contain 7 to 8 digits.');
  }

  return registrationNumber.padStart(8, '0');
}

export function parseLimit(value: unknown, defaultValue: number, maxValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new RequestValidationError('Limit must be a positive integer.');
  }

  const limit = Number(value);

  if (limit < 1 || limit > maxValue) {
    throw new RequestValidationError(`Limit must be between 1 and ${maxValue}.`);
  }

  return limit;
}
