import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestContext } from '../models/request_context.ts';

const storage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(
    context: RequestContext,
    callback: () => T,
  ): T {
    return storage.run(context, callback);
  },

  get(): RequestContext | undefined {
    return storage.getStore();
  },

  require(): RequestContext {
    const context = storage.getStore();

    if (!context) {
      throw new Error(
        'Request context is unavailable. Ensure correlation middleware runs first.',
      );
    }

    return context;
  },
};