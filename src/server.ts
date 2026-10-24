import type { Server as HttpServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import type { Express } from 'express';
import type { Logger } from 'pino';
import { App } from './app.ts';
import type { DatabaseClient } from './repositories/database.ts';
import { DependencyRoot } from './services/dependencies.ts';
import { loadSettings, type Settings } from './settings.ts';
import { createLogger } from './utils/logger.ts';

export interface ExpressApplication {
  readonly app: Express;
}

export class Server {
  private httpServer: HttpServer | null = null;
  private shuttingDown = false;

  public constructor(
    private readonly application: ExpressApplication,
    private readonly dbClient: DatabaseClient,
    private readonly settings: Settings,
    private readonly logger: Logger,
  ) {}

  public async start(): Promise<void> {
    await this.dbClient.connect();

    await new Promise<void>((resolve, reject) => {
      const server = this.application.app.listen(
        this.settings.PORT,
        this.settings.HOST,
        () => {
          server.off('error', reject);
          this.logger.info(
            {
              host: this.settings.HOST,
              port: this.settings.PORT,
              environment: this.settings.NODE_ENV,
            },
            'StayRoom HTTP server listening',
          );
          resolve();
        },
      );

      server.once('error', reject);
      this.httpServer = server;
    });
  }

  public async shutdown(signal = 'SIGTERM'): Promise<void> {
    if (this.shuttingDown) {
      return;
    }
    this.shuttingDown = true;

    this.logger.info({ signal }, 'Graceful shutdown initiated');

    const timeout = setTimeout(() => {
      this.logger.error('Graceful shutdown timed out; forcing exit');
      this.logger.flush();
      process.exit(1);
    }, this.settings.SHUTDOWN_TIMEOUT_MS);
    timeout.unref();

    try {
      if (this.httpServer) {
        const activeServer = this.httpServer;
        await new Promise<void>((resolve, reject) => {
          activeServer.close((err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
        this.httpServer = null;
      }

      await this.dbClient.disconnect();
      this.logger.info('Graceful shutdown complete');
      this.logger.flush();
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function main(): Promise<void> {
  const settings = loadSettings();
  const logger = createLogger(settings);
  const root = new DependencyRoot(settings, logger);
  const deps = root.compose();
  const application = new App(deps, settings, logger);
  const server = new Server(application, deps.dbClient, settings, logger);

  const onSignal = (signal: NodeJS.Signals): void => {
    void server
      .shutdown(signal)
      .then(() => process.exit(0))
      .catch((err: unknown) => {
        logger.error({ err }, 'Error during shutdown');
        logger.flush();
        process.exit(1);
      });
  };

  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    logger.flush();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal(
      {
        err:
          reason instanceof Error
            ? reason
            : new Error(String(reason)),
      },
      'Unhandled promise rejection',
    );
    logger.flush();
    process.exit(1);
  });

  await server.start();
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main().catch((err: unknown) => {
    console.error('Failed to start StayRoom server:', err);
    process.exit(1);
  });
}