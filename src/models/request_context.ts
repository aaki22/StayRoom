import type { UserRole } from '../constants/constants.ts';

export interface AuthenticatedUser {
  userId: string;
  actorId: string;
  role: UserRole;
}

export interface RequestContext {
  requestId: string;
  actorId: string;
  traceId?: string;
  spanId?: string;
  user?: AuthenticatedUser;
}