import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

import {
  REQUEST_ID_HEADER,
} from '../constants/constants.ts';

import {
  requestContext,
} from '../utils/request_context.ts';

export const correlationIdMiddleware: RequestHandler = (
  _request,
  response,
  next,
) => {
  const requestId = `req-${randomUUID()}`;

  response.setHeader(
    REQUEST_ID_HEADER,
    requestId,
  );

  requestContext.run(
    { requestId },
    next,
  );
};