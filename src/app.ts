import express, { type Express } from 'express';
import { API_PREFIX } from './constants/constants.ts';
import { createErrorHandler, notFoundHandler } from './middleware/error_handler.ts';
import { configureHttpMiddleware } from './middleware/http_middleware.ts';
import type { ApplicationDependencies } from './services/dependencies.ts';

export class App {
  public readonly app: Express;

  public constructor(private readonly deps: ApplicationDependencies) {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  public configureMiddleware(): void {
    configureHttpMiddleware(this.app, this.deps.settings, this.deps.logger);
  }

  public configureRoutes(): void {
    this.app.use(API_PREFIX, this.deps.defaultRoutes.router);
  }

  public configureErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(createErrorHandler(this.deps.logger));
  }
}