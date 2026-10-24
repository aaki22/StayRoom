import { z } from 'zod';

export interface HealthDTO {
  status: 'UP';
  service: string;
}

export const healthRequestSchema = z.object({
  body: z.undefined(),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  headers: z.looseObject({}),
});