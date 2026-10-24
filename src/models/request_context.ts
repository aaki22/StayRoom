import type { UserRole } from '../constants/constants.ts';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

export interface RequestContext {
  requestId: string;
  user?: AuthenticatedUser;
}