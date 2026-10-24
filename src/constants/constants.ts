export const APP_NAME = 'stayroom';
export const API_PREFIX = '/api/v1';
export const REQUEST_ID_HEADER = 'X-Request-ID';

export const SYSTEM_ACTOR_ID = '00000000-0000-4000-8000-000000000001';

export const AUTH = Object.freeze({
  ACCESS_TOKEN_SECONDS: 15 * 60,
  REFRESH_TOKEN_SECONDS: 7 * 24 * 60 * 60,
  RESET_TOKEN_SECONDS: 15 * 60,
  JWT_ALGORITHM: 'HS256',
});

export const BOOKING = Object.freeze({
  HOLD_SECONDS: 10 * 60,
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 30,
  MAX_ADVANCE_DAYS: 365,
  CURRENCY: 'INR',
});

export const BOOKING_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'NO_SHOW',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];