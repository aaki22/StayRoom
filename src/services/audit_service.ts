import type { AuditEvent, JsonObject, JsonValue } from '../models/audit_models.ts';
import type { RequestContext } from '../models/request_context.ts';
import type { IAuditRepository } from '../repositories/audit_repository.ts';
import type { TransactionContext } from '../repositories/database.ts';

export interface IAuditService {
  record(event: AuditEvent, ctx: RequestContext, tx: TransactionContext): Promise<void>;
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'newpassword',
  'currentpassword',
  'token',
  'tokenhash',
  'token_hash',
  'refreshtoken',
  'resettoken',
  'authorization',
  'razorpay_signature',
  'secret',
]);

function sanitizeJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sanitizeJsonValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeJsonObject(value);
  }
  return value;
}

function sanitizeJsonObject(input: JsonObject): JsonObject {
  const sanitized: JsonObject = {};
  for (const [key, val] of Object.entries(input)) {
    const normalized = key.toLowerCase();
    sanitized[key] = REDACTED_KEYS.has(normalized) ? '[REDACTED]' : sanitizeJsonValue(val);
  }
  return sanitized;
}

export class AuditService implements IAuditService {
  public constructor(private readonly repository: IAuditRepository) {}

  public async record(event: AuditEvent, ctx: RequestContext, tx: TransactionContext): Promise<void> {
    await this.repository.append(
      {
        ...event,
        changes: sanitizeJsonObject(event.changes),
      },
      ctx,
      tx,
    );
  }
}