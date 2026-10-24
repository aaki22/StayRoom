import type { RequestHandler } from 'express';
import type { ITokenClient } from '../client/token_client.ts';
import type { UserRole } from '../constants/constants.ts';
import { ForbiddenError, UnauthorizedError } from '../utils/exceptions/exceptions.ts';
import { requestContext } from '../utils/request_context.ts';

export type ActiveUserVerifier = (userId: string) => Promise<boolean>;

export function authenticate(tokenClient: ITokenClient, verifyActiveUser?: ActiveUserVerifier): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.get('Authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    const token = match?.[1];
    if (!token) {
      throw new UnauthorizedError();
    }

    const verifiedUser = await tokenClient.verifyAccessToken(token);
    if (verifyActiveUser) {
      const isActive = await verifyActiveUser(verifiedUser.userId);
      if (!isActive) {
        throw new UnauthorizedError();
      }
    }

    const ctx = requestContext.require();
    ctx.user = verifiedUser;
    ctx.actorId = verifiedUser.actorId;
    next();
  };
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (_request, _response, next) => {
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