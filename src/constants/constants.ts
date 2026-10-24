export const APP_NAME = 'stayroom';
export const HEALTH_SERVICE_NAME = 'room-booking-api';
export const API_PREFIX = '/api/v1';
export const REQUEST_ID_HEADER = 'X-Request-ID';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const RAZORPAY_SIGNATURE_HEADER = 'X-Razorpay-Signature';
export const RAZORPAY_EVENT_ID_HEADER = 'X-Razorpay-Event-Id';

export const SYSTEM_ACTOR_ID = '00000000-0000-4000-8000-000000000001';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_COUNTRY_CODE = 'IN';

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
  MIN_GUESTS: 1,
  MAX_GUESTS: 10,
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUDIT_ACTOR_TYPES = ['USER', 'ADMIN', 'SYSTEM'] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const ROOM_STATUSES = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

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

export const BOOKING_PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'] as const;
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['RAZORPAY'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_MODES = ['TEST'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_ORDER_CREATION_STATUSES = ['PENDING', 'CREATED', 'FAILED'] as const;
export type PaymentOrderCreationStatus = (typeof PAYMENT_ORDER_CREATION_STATUSES)[number];

export const PAYMENT_ORDER_STATUSES = ['CREATED', 'PAID'] as const;
export type PaymentOrderStatus = (typeof PAYMENT_ORDER_STATUSES)[number];

export const PAYMENT_ATTEMPT_STATUSES = ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'] as const;
export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

export const REFUND_STATUSES = ['PENDING', 'PROCESSED', 'FAILED'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const WEBHOOK_EVENT_STATUSES = ['PENDING', 'PROCESSED', 'IGNORED', 'FAILED'] as const;
export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUSES)[number];

export const EMAIL_OUTBOX_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const;
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number];

export const IDEMPOTENCY_STATUSES = ['IN_PROGRESS', 'COMPLETED'] as const;
export type IdempotencyStatus = (typeof IDEMPOTENCY_STATUSES)[number];