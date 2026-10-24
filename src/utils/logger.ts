import { isSpanContextValid, trace } from '@opentelemetry/api';
import { pino, type DestinationStream, type Logger } from 'pino';

import { APP_NAME } from '../constants/constants.ts';
import type { Settings } from '../settings.ts';
import { requestContext } from './request_context.ts';

export type ILogger = Logger;

const REDACTED_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'current_password',
  'new_password',
  'password_hash',
  'passwordHash',
  'token',
  'token_hash',
  'tokenHash',
  'accessToken',
  'refreshToken',
  'resetToken',
  'access_token',
  'refresh_token',
  'reset_token',
  'authorization',
  'cookie',
  'razorpay_signature',
  'razorpaySignature',
  'webhookSecret',
  'secret',
  'pepper',
  'cipherKey',
  'encryptionKey',
  'databaseUrl',
  'DATABASE_URL',
  'JWT_SECRET_BASE64',
  'PAYLOAD_ENCRYPTION_KEY_BASE64',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SMTP_PASS',
] as const;

const REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-razorpay-signature"]',
  'res.headers["set-cookie"]',
  ...REDACTED_FIELDS,
  ...REDACTED_FIELDS.map((field) => `*.${field}`),
  ...REDACTED_FIELDS.map((field) => `*.*.${field}`),
];

export function createLogger(settings: Settings, destination?: DestinationStream): Logger {
  return pino(
    {
      level: settings.LOG_LEVEL,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: APP_NAME,
        environment: settings.NODE_ENV,
      },
      formatters: {
        level(label) {
          return { level: label };
        },
      },
      serializers: {
        err: pino.stdSerializers.err,
      },
      redact: {
        paths: REDACT_PATHS,
        censor: '[REDACTED]',
      },
      mixin() {
        const metadata: Record<string, unknown> = {};
        const context = requestContext.get();
        if (context) {
          metadata['request_id'] = context.requestId;
          metadata['actor_id'] = context.actorId;
          if (context.user) {
            metadata['user_id'] = context.user.userId;
            metadata['user_role'] = context.user.role;
          }
          if (context.traceId) {
            metadata['trace_id'] = context.traceId;
          }
          if (context.spanId) {
            metadata['span_id'] = context.spanId;
          }
        }

        const activeSpan = trace.getActiveSpan();
        if (activeSpan) {
          const spanContext = activeSpan.spanContext();
          if (isSpanContextValid(spanContext)) {
            metadata['trace_id'] = spanContext.traceId;
            metadata['span_id'] = spanContext.spanId;
          }
        }

        return metadata;
      },
    },
    destination,
  );
}