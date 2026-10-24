import { Router, type Request, type Response } from 'express';
import { HEALTH_SERVICE_NAME } from '../constants/constants.ts';
import { methodNotAllowedHandler } from '../middleware/error_handler.ts';
import { validateRequest } from '../middleware/validation.ts';
import { healthRequestSchema, type HealthDTO } from '../models/dtos/default_models.ts';
import { successResponse } from '../models/response_builder.ts';

export class DefaultRoutes {
  public readonly router: Router;

  public constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  public registerRoutes(): void {
    this.router
      .route('/health')
      .get(validateRequest(healthRequestSchema), this.health)
      .all(methodNotAllowedHandler(['GET']));
  }

  public readonly health = (_request: Request, response: Response): void => {
    const payload: HealthDTO = {
      status: 'UP',
      service: HEALTH_SERVICE_NAME,
    };
    response.status(200).json(successResponse(200, 'Service health completed', payload));
  };
}