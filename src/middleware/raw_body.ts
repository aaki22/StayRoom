import {
  raw,
  type RequestHandler,
} from 'express';

export const rawBodyMiddleware: RequestHandler = raw({
  type: 'application/json',
  limit: '64kb',
});