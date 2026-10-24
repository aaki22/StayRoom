import express, {
  type Express,
} from 'express';

import cors from 'cors';
import helmet from 'helmet';

import { pinoHttp } from 'pino-http';

import type { Logger } from 'pino';

import {
  API_PREFIX,
  REQUEST_ID_HEADER,
} from '../constants/constants.ts';

import type { Settings } from '../settings.ts';

import {
  requestContext,
} from '../utils/request_context.ts';

import {
  requestContextMiddleware,
} from '../middleware/request_context.ts';

import {
  rawBodyMiddleware,
} from '../middleware/raw_body.ts';

export function configureHttpMiddleware(
  app: Express,
  settings: Settings,
  logger: Logger,
): void {
  app.disable('x-powered-by');

  app.use(requestContextMiddleware);

  app.use(
    pinoHttp({
      logger,

      genReqId: () =>
        requestContext.require().requestId,

      serializers: {
        req: (
          request: {
            method?: string;
            url?: string;
          },
        ) => ({
          method: request.method,
          path: request.url?.split('?')[0],
        }),

        res: (
          response: {
            statusCode?: number;
          },
        ) => ({
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

  // Preserve provider webhook bytes before general JSON parsing.
  app.use(
    `${API_PREFIX}/webhooks/razorpay`,
    rawBodyMiddleware,
  );

  app.use(
    express.json({
      limit: '64kb',
      strict: true,
    }),
  );
}