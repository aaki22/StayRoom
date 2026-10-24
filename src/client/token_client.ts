import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { AUTH, USER_ROLES } from '../constants/constants.ts';
import type { AuthenticatedUser } from '../models/request_context.ts';
import type { Settings } from '../settings.ts';
import { UnauthorizedError } from '../utils/exceptions/exceptions.ts';

export interface ITokenClient {
  signAccessToken(user: AuthenticatedUser): Promise<string>;
  verifyAccessToken(token: string): Promise<AuthenticatedUser>;
  generateOpaqueToken(): string;
  hashOpaqueToken(token: string): string;
}

const claimsSchema = z.object({
  sub: z.uuid(),
  actorId: z.uuid(),
  role: z.enum(USER_ROLES),
  exp: z.number(),
  iat: z.number(),
});

export class TokenClient implements ITokenClient {
  private readonly key: Uint8Array;

  public constructor(private readonly settings: Settings) {
    this.key = Buffer.from(settings.JWT_SECRET_BASE64, 'base64');
  }

  public async signAccessToken(user: AuthenticatedUser): Promise<string> {
    return new SignJWT({
      actorId: user.actorId,
      role: user.role,
    })
      .setProtectedHeader({
        alg: AUTH.JWT_ALGORITHM,
        typ: 'JWT',
      })
      .setSubject(user.userId)
      .setIssuer(this.settings.JWT_ISSUER)
      .setAudience(this.settings.JWT_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${AUTH.ACCESS_TOKEN_SECONDS}s`)
      .sign(this.key);
  }

  public async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [AUTH.JWT_ALGORITHM],
        typ: 'JWT',
        issuer: this.settings.JWT_ISSUER,
        audience: this.settings.JWT_AUDIENCE,
        requiredClaims: ['sub', 'actorId', 'exp', 'iat', 'role'],
        maxTokenAge: `${AUTH.ACCESS_TOKEN_SECONDS}s`,
      });
      const claims = claimsSchema.parse(payload);
      return {
        userId: claims.sub,
        actorId: claims.actorId,
        role: claims.role,
      };
    } catch {
      throw new UnauthorizedError();
    }
  }

  public generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  public hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}