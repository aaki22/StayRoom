import type { RequestContext } from '../models/request_context.ts';

export interface IJob {
  readonly name: string;
  run(ctx: RequestContext): Promise<void>;
}