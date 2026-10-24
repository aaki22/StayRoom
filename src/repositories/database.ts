import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Logger } from 'pino';
import { Prisma, PrismaClient } from './generated/client.ts';
import type { Settings } from '../settings.ts';

export type OrmClient = PrismaClient;
export type OrmTransactionClient = Prisma.TransactionClient;
export type OrmExecutor = PrismaClient | Prisma.TransactionClient;
export type ReadWork<T> = (orm: PrismaClient) => Promise<T>;
export type TransactionWork<T> = (tx: Prisma.TransactionClient) => Promise<T>;

export interface TransactionOptions {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
  timeout?: number;
}

export const TransactionIsolationLevel = Prisma.TransactionIsolationLevel;

export class DatabaseClient {
  private readonly pool: Pool;
  private readonly orm: PrismaClient;
  private connected = false;

  public constructor(
    private readonly settings: Settings,
    private readonly logger?: Logger,
  ) {
    this.pool = new Pool({
      connectionString: settings.DATABASE_URL,
      max: settings.DB_POOL_MAX,
      connectionTimeoutMillis: settings.DB_CONNECTION_TIMEOUT_MS,
      query_timeout: settings.DB_QUERY_TIMEOUT_MS,
      statement_timeout: settings.DB_QUERY_TIMEOUT_MS,
    });

    this.pool.on('error', (err) => {
      this.logger?.error(
        { err },
        'Unexpected PostgreSQL idle pool client error',
      );
    });

    const adapter = new PrismaPg(this.pool);
    this.orm = new PrismaClient({ adapter });
  }

  public get client(): PrismaClient {
    return this.orm;
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.orm.$connect();
    await this.ping();
    this.connected = true;

    this.logger?.info('PostgreSQL connection pool established');
  }

  public async ping(): Promise<void> {
    await this.orm.auditActor.findFirst({
      select: { id: true },
    });
  }

  public async read<T>(work: ReadWork<T>): Promise<T> {
    return work(this.orm);
  }

  public async transaction<T>(
    work: TransactionWork<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    return this.orm.$transaction(
      async (tx) => work(tx),
      {
        maxWait:
          options?.maxWait ?? this.settings.DB_CONNECTION_TIMEOUT_MS,
        timeout:
          options?.timeout ?? this.settings.DB_TRANSACTION_TIMEOUT_MS,
        ...(options?.isolationLevel !== undefined
          ? { isolationLevel: options.isolationLevel }
          : {}),
      },
    );
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      await this.pool.end();
      return;
    }

    await this.orm.$disconnect();
    await this.pool.end();
    this.connected = false;

    this.logger?.info('PostgreSQL connection pool closed');
  }
}