import { z } from 'zod';

export interface IdempotencyHeaderDTO {
  'idempotency-key': string;
}

export const idempotencyHeaderSchema = z.looseObject({
  'idempotency-key': z.string().trim().min(8).max(128),
});