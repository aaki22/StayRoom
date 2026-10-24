import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { SYSTEM_ACTOR_ID } from './constants/constants.ts';
import { DependencyRoot, type WorkerDependencies } from './services/dependencies.ts';
import { loadSettings } from './settings.ts';
import { requestContext } from './utils/request_context.ts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref();
  });
}

export class BackgroundWorker {
  private stopping = false;
  private activeCycle: Promise<void> | null = null;

  public constructor(private readonly deps: WorkerDependencies) {}

  private isStopping(): boolean {
    return this.stopping;
  }

  public async startJobs(): Promise<void> {
    await this.deps.dbClient.connect();
    this.deps.logger.info(
      { jobCount: this.deps.jobs.length, pollIntervalMs: this.deps.settings.WORKER_POLL_INTERVAL_MS },
      'STAYROOM background worker started',
    );

    while (!this.isStopping()) {
      this.activeCycle = this.runCycle();
      await this.activeCycle;
      this.activeCycle = null;

      if (!this.isStopping()) {
        await sleep(this.deps.settings.WORKER_POLL_INTERVAL_MS);
      }
    }
  }

  private async runCycle(): Promise<void> {
    for (const job of this.deps.jobs) {
      if (this.isStopping()) {
        break;
      }

      const ctx = {
        requestId: `job-${job.name}-${randomUUID()}`,
        actorId: SYSTEM_ACTOR_ID,
      };

      await requestContext.run(ctx, async () => {
        try {
          await job.run(ctx);
        } catch (err) {
          this.deps.logger.error({ err, job: job.name }, 'Background job cycle failed');
        }
      });
    }
  }

  public async shutdown(signal: string): Promise<void> {
    if (this.stopping) {
      return;
    }
    this.stopping = true;
    this.deps.logger.info({ signal }, 'Stopping STAYROOM background worker');

    const timeout = setTimeout(() => {
      this.deps.logger.error('Worker graceful shutdown timed out; forcing exit');
      this.deps.logger.flush();
      process.exit(1);
    }, this.deps.settings.SHUTDOWN_TIMEOUT_MS);
    timeout.unref();

    try {
      if (this.activeCycle) {
        await this.activeCycle;
      }
      await this.deps.dbClient.disconnect();
      clearTimeout(timeout);
      this.deps.logger.info('STAYROOM background worker stopped cleanly');
      this.deps.logger.flush();
    } catch (err) {
      clearTimeout(timeout);
      this.deps.logger.error({ err }, 'Error during background worker shutdown');
      this.deps.logger.flush();
      process.exitCode = 1;
    }
  }
}

async function bootstrapWorker(): Promise<void> {
  const settings = loadSettings();
  const deps = new DependencyRoot(settings).composeWorker();
  const worker = new BackgroundWorker(deps);

  const onSignal = (signal: NodeJS.Signals): void => {
    void worker.shutdown(signal);
  };

  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  process.on('unhandledRejection', (reason) => {
    deps.logger.fatal({ err: reason }, 'Unhandled worker promise rejection');
    deps.logger.flush();
    void worker.shutdown('unhandledRejection').finally(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    deps.logger.fatal({ err }, 'Uncaught worker exception');
    deps.logger.flush();
    void worker.shutdown('uncaughtException').finally(() => process.exit(1));
  });

  await worker.startJobs();
}

void bootstrapWorker();