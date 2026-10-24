import { z } from 'zod';

const positiveInteger = (fallback: number): z.ZodDefault<z.ZodCoercedNumber> =>
  z.coerce.number().int().positive().default(fallback);

const booleanFromString = (fallback: boolean): z.ZodDefault<z.ZodType<boolean>> =>
  z
    .preprocess((val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
      }
      return val;
    }, z.boolean())
    .default(fallback);

const base64Key32Bytes = z
  .string()
  .regex(/^[A-Za-z0-9+/]+={0,2}$/)
  .refine((value) => {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length === 32 && decoded.toString('base64') === value;
  }, 'Provide a canonical base64 key containing exactly 32 random bytes');

const base64SecretMin32Bytes = z
  .string()
  .regex(/^[A-Za-z0-9+/]+={0,2}$/)
  .refine((value) => {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length >= 32 && decoded.toString('base64') === value;
  }, 'Provide a canonical base64 key containing at least 32 random bytes');

const settingsSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  APP_BASE_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.url().refine((value) => /^postgres(?:ql)?:/.test(value), 'Use a PostgreSQL URL'),
  DB_POOL_MAX: positiveInteger(10),
  DB_CONNECTION_TIMEOUT_MS: positiveInteger(5000),
  DB_QUERY_TIMEOUT_MS: positiveInteger(5000),
  DB_TRANSACTION_TIMEOUT_MS: positiveInteger(10000),
  SHUTDOWN_TIMEOUT_MS: positiveInteger(15000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(
          z.url().refine((value) => {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
          }, 'Supply an HTTP origin without a path or trailing slash'),
        )
        .min(1),
    ),
  JWT_ISSUER: z.string().min(1).default('stayroom'),
  JWT_AUDIENCE: z.string().min(1).default('stayroom-customer'),
  JWT_SECRET_BASE64: base64SecretMin32Bytes,
  PAYLOAD_ENCRYPTION_KEY_ID: z.string().min(1).max(100).default('v1'),
  PAYLOAD_ENCRYPTION_KEY_BASE64: base64Key32Bytes,
  RAZORPAY_KEY_ID: z
    .string()
    .min(1)
    .refine((val) => val.startsWith('rzp_test_'), 'Only Razorpay TEST keys (rzp_test_*) are permitted in v1')
    .default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().min(1).default('razorpay_test_secret_placeholder'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).default('razorpay_webhook_secret_placeholder'),
  RAZORPAY_API_TIMEOUT_MS: positiveInteger(8000),
  SMTP_HOST: z.string().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: booleanFromString(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().min(3).default('Stayroom <no-reply@stayroom.local>'),
  RATE_LIMIT_ENABLED: booleanFromString(true),
  WORKER_POLL_INTERVAL_MS: positiveInteger(5000),
  WORKER_BATCH_SIZE: positiveInteger(25),
});

export type Settings = z.infer<typeof settingsSchema>;

export function loadSettings(environment: NodeJS.ProcessEnv = process.env): Settings {
  const result = settingsSchema.safeParse(environment);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Missing or invalid settings: ${fields.join(', ')}`);
  }
  return result.data;
}