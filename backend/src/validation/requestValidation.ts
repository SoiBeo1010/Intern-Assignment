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

  if (!/^\d{8}$/.test(registrationNumber)) {
    throw new RequestValidationError('Registration number must contain exactly 8 digits.');
  }

  return registrationNumber;
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
