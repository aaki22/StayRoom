import type { AuditActorType } from '../constants/constants.ts';
import type { AuditActor } from './generated/client.ts';
import type { DatabaseClient, TransactionContext } from './database.ts';

export interface CreateAuditActorRecord {
  id: string;
  actorType: AuditActorType;
  actorName: string;
  actorId: string;
}

export interface IAuditActorRepository {
  create(input: CreateAuditActorRecord, tx: TransactionContext): Promise<AuditActor>;
  updateName(actorId: string, actorName: string, updatedBy: string, tx: TransactionContext): Promise<void>;
  findById(id: string): Promise<AuditActor | null>;
}

export class AuditActorRepository implements IAuditActorRepository {
  public constructor(private readonly db: DatabaseClient) {}

  public async create(input: CreateAuditActorRecord, tx: TransactionContext): Promise<AuditActor> {
    return this.db.execute(tx, (client) =>
      client.auditActor.create({
        data: {
          id: input.id,
          actor_type: input.actorType,
          actor_name: input.actorName,
          created_by: input.actorId,
          updated_by: input.actorId,
        },
      }),
    );
  }

  public async updateName(
    actorId: string,
    actorName: string,
    updatedBy: string,
    tx: TransactionContext,
  ): Promise<void> {
    await this.db.execute(tx, (client) =>
      client.auditActor.update({
        where: { id: actorId },
        data: {
          actor_name: actorName,
          updated_by: updatedBy,
        },
      }),
    );
  }

  public async findById(id: string): Promise<AuditActor | null> {
    return this.db.read((client) =>
      client.auditActor.findUnique({
        where: { id },
      }),
    );
  }
}