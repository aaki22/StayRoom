import 'dotenv/config';

import {
  defineConfig,
  env,
} from 'prisma/config';

export default defineConfig({
  schema:
    'src/repositories/schema/schema.prisma',

  migrations: {
    path:
      'src/repositories/schema/migrations',

    seed:
      'tsx src/repositories/seed.ts',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});