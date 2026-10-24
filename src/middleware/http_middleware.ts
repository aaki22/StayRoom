import type { IncomingMessage, ServerResponse } from 'node:http';

import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import type { LevelWithSilent, Logger } from 'pino';
import { pinoHttp } from 'pino-http';

import { API_PREFIX, REQUEST_ID_HEADER } from '../constants/constants.ts';
import type { Settings } from '../settings.ts';
import { ERROR_CODES } from '../utils/exceptions/error_codes.ts';
import { AppException } from '../utils/exceptions/exceptions.ts';
import { requestContext } from '../utils/request_context.ts';
import { rawBodyMiddleware } from './raw_body.ts';
import { requestContextMiddleware } from './request_context.ts';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const enforceJsonContentType: RequestHandler = (request, _response, next) => {
  if (!BODY_METHODS.has(request.method)) {
    next();
    return;
  }

  const contentLength = request.get('content-length');
  const transferEncoding = request.get('transfer-encoding');
  const hasBody = (contentLength !== undefined && contentLength !== '0') || transferEncoding !== undefined;

  if (hasBody && !request.is('application/json')) {
    next(
      new AppException(
        415,
        ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        'Content-Type must be application/json',
        'Content-Type',
      ),
    );
    return;
  }

  next();
};

function resolveHttpLogLevel(
  _request: IncomingMessage,
  response: ServerResponse,
  error?: Error,
): LevelWithSilent {
  if (error !== undefined || response.statusCode >= 500) {
    return 'error';
  }
  if (response.statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

export function configureHttpMiddleware(app: Express, settings: Settings, logger: Logger): void {
  app.disable('x-powered-by');

  app.use(requestContextMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: () => requestContext.require().requestId,
      customLogLevel: resolveHttpLogLevel,
      serializers: {
        req: (request: { method?: string; url?: string }) => ({
          method: request.method,
          path: request.url?.split('?')[0],
        }),
        res: (response: { statusCode?: number }) => ({
          statusCode: response.statusCode,
        }),
      },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: settings.CORS_ORIGINS,
      exposedHeaders: [REQUEST_ID_HEADER],
    }),
  );

  app.use(enforceJsonContentType);

  // Preserve exact provider webhook bytes before general JSON parsing.
  app.use(`${API_PREFIX}/webhooks/razorpay`, rawBodyMiddleware);

  app.use(
    express.json({
      limit: '64kb',
      strict: true,
    }),
  );
}