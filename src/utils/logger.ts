import { pino, type Logger } from 'pino';

import { APP_NAME } from '../constants/constants.ts';
import { requestContext } from './request_context.ts';

import type { Settings } from '../settings.ts';

export function createLogger(
  settings: Settings,
): Logger {
  return pino({
    level: settings.LOG_LEVEL,

    base: {
      service: APP_NAME,
      environment: settings.NODE_ENV,
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'password',
        'password_hash',
        'token',
        'refreshToken',
        'resetToken',
        'secret',
        'databaseUrl',
      ],
      censor: '[REDACTED]',
    },

    mixin() {
      const context = requestContext.get();

      return context
        ? { request_id: context.requestId }
        : {};
    },
  });
}