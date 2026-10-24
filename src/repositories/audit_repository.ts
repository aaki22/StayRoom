import type { AuditEvent } from '../models/audit_models.ts';
import type { RequestContext } from '../models/request_context.ts';
import type { DatabaseClient, TransactionContext } from './database.ts';

export interface IAuditRepository {
  append(event: AuditEvent, ctx: RequestContext, tx: TransactionContext): Promise<void>;
}

export class AuditRepository implements IAuditRepository {
  public constructor(private readonly db: DatabaseClient) {}

  public async append(event: AuditEvent, ctx: RequestContext, tx: TransactionContext): Promise<void> {
    await this.db.execute(tx, async (client) => {
      await client.auditLog.create({
        data: {
          actor_id: ctx.actorId,
          action: event.action,
          entity_type: event.entityType,
          entity_id: event.entityId,
          changes: event.changes,
          request_id: ctx.requestId,
          created_by: ctx.actorId,
          updated_by: ctx.actorId,
        },
      });
    });
  }
}