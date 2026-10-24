import type { RequestHandler } from 'express';

import type {
  ITokenClient,
} from '../client/token_client.ts';

import type {
  UserRole,
} from '../constants/constants.ts';

import {
  requestContext,
} from '../utils/request_context.ts';

import {
  ForbiddenError,
  UnauthorizedError,
} from '../utils/exceptions/exceptions.ts';

export function authenticate(
  tokenClient: ITokenClient,
): RequestHandler {
  return async (
    request,
    _response,
    next,
  ) => {
    const authorization =
      request.get('Authorization');

    const match = authorization?.match(
      /^Bearer ([^\s]+)$/i,
    );

    const token = match?.[1];

    if (!token) {
      throw new UnauthorizedError();
    }

    requestContext.require().user =
      await tokenClient.verifyAccessToken(token);

    next();
  };
}

export function requireRole(
  ...roles: UserRole[]
): RequestHandler {
  return (
    _request,
    _response,
    next,
  ) => {
    const user = requestContext.require().user;

    if (!user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}