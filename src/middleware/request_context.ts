import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

import { REQUEST_ID_HEADER, SYSTEM_ACTOR_ID } from '../constants/constants.ts';
import type { RequestContext } from '../models/request_context.ts';
import { requestContext } from '../utils/request_context.ts';

const W3C_TRACEPARENT_PATTERN = /^00-([\da-f]{32})-([\da-f]{16})-[\da-f]{2}$/;
const ZERO_TRACE_ID = '00000000000000000000000000000000';
const ZERO_SPAN_ID = '0000000000000000';

function parseTraceparent(headerValue: string | undefined): { traceId: string; spanId: string } | null {
  if (!headerValue) {
    return null;
  }
  const match = W3C_TRACEPARENT_PATTERN.exec(headerValue.trim().toLowerCase());
  if (!match) {
    return null;
  }
  const traceId = match[1];
  const spanId = match[2];
  if (!traceId || !spanId || traceId === ZERO_TRACE_ID || spanId === ZERO_SPAN_ID) {
    return null;
  }
  return { traceId, spanId };
}

export const requestContextMiddleware: RequestHandler = (request, response, next) => {
  const requestId = `req-${randomUUID()}`;
  response.setHeader(REQUEST_ID_HEADER, requestId);

  const ctx: RequestContext = {
    requestId,
    actorId: SYSTEM_ACTOR_ID,
  };

  const traceInfo = parseTraceparent(request.get('traceparent'));
  if (traceInfo) {
    ctx.traceId = traceInfo.traceId;
    ctx.spanId = traceInfo.spanId;
  }

  requestContext.run(ctx, next);
};