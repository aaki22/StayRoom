import type { Logger } from 'pino';
import { PasswordClient, type IPasswordClient } from '../client/password_client.ts';
import { PayloadCipherClient, type IPayloadCipherClient } from '../client/payload_cipher_client.ts';
import { TokenClient, type ITokenClient } from '../client/token_client.ts';
import type { IJob } from '../jobs/job.ts';
import { AuditActorRepository, type IAuditActorRepository } from '../repositories/audit_actor_repository.ts';
import { AuditRepository, type IAuditRepository } from '../repositories/audit_repository.ts';
import { DatabaseClient } from '../repositories/database.ts';
import { DefaultRoutes } from '../routes/default.ts';
import type { Settings } from '../settings.ts';
import { createLogger } from '../utils/logger.ts';
import { AuditService, type IAuditService } from './audit_service.ts';

export interface ApplicationDependencies {
  readonly settings: Settings;
  readonly logger: Logger;
  readonly dbClient: DatabaseClient;
  readonly tokenClient: ITokenClient;
  readonly passwordClient: IPasswordClient;
  readonly payloadCipherClient: IPayloadCipherClient;
  readonly auditActorRepository: IAuditActorRepository;
  readonly auditRepository: IAuditRepository;
  readonly auditService: IAuditService;
  readonly defaultRoutes: DefaultRoutes;
}

export interface WorkerDependencies {
  readonly settings: Settings;
  readonly logger: Logger;
  readonly dbClient: DatabaseClient;
  readonly jobs: readonly IJob[];
}

export class DependencyRoot {
  public constructor(private readonly settings: Settings) {}

  public compose(): ApplicationDependencies {
    const logger = createLogger(this.settings);
    const dbClient = new DatabaseClient(this.settings, logger);
    const tokenClient = new TokenClient(this.settings);
    const passwordClient = new PasswordClient();
    const payloadCipherClient = new PayloadCipherClient(this.settings);

    const auditActorRepository = new AuditActorRepository(dbClient);
    const auditRepository = new AuditRepository(dbClient);
    const auditService = new AuditService(auditRepository);

    const defaultRoutes = new DefaultRoutes();

    return {
      settings: this.settings,
      logger,
      dbClient,
      tokenClient,
      passwordClient,
      payloadCipherClient,
      auditActorRepository,
      auditRepository,
      auditService,
      defaultRoutes,
    };
  }

  public composeWorker(): WorkerDependencies {
    const logger = createLogger(this.settings);
    const dbClient = new DatabaseClient(this.settings, logger);
    const jobs: IJob[] = [];

    return {
      settings: this.settings,
      logger,
      dbClient,
      jobs,
    };
  }
}