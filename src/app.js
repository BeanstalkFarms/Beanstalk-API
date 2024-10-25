const priceRoutes = require('./routes/price-routes.js');
const coingeckoRoutes = require('./routes/coingecko-routes.js');
const siloRoutes = require('./routes/silo-routes.js');
const snapshotRoutes = require('./routes/snapshot-routes.js');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const cors = require('@koa/cors');
const { activateJobs } = require('./scheduled/cron-schedule.js');
const { sequelize } = require('./repository/postgres/models/index.js');
const { formatBigintDecimal } = require('./utils/bigint.js');
const AsyncContext = require('./utils/async/context.js');
const EnvUtil = require('./utils/env.js');
const ChainUtil = require('./utils/chain.js');
const AlchemyUtil = require('./datasources/alchemy.js');
const StartupSeeder = require('./repository/postgres/startup-seeders/startup-seeder.js');

async function appStartup() {
  // Activate whichever cron jobs are configured, if any
  const cronJobs = EnvUtil.getEnabledCronJobs();
  if (cronJobs.length > 0) {
    activateJobs(cronJobs);
  }

  for (const chain of EnvUtil.getEnabledChains()) {
    await AlchemyUtil.ready(chain);
  }

  // This can be useful for local development, though migrations should be used instead
  // sequelize.sync();

  // Long-running async seeder process, the api will come online before this is complete.
  StartupSeeder.seedDatabase();

  const app = new Koa();

  app.use(
    cors({
      origin: '*'
    })
  );

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    const chain = ctx.query.chain ?? EnvUtil.defaultChain();
    if (!ChainUtil.isValidChain(chain) || !EnvUtil.isChainEnabled(chain)) {
      ctx.status = 400;
      ctx.body = {
        message: `Invalid chain '${chain}' was requested.`
      };
      return;
    }
    // Stores chain in the async context
    await AsyncContext.run({ chain }, next);
  });

  app.use(async (ctx, next) => {
    if (!ctx.originalUrl.includes('healthcheck')) {
      const requestInfo = `${new Date().toISOString()} [request] ${ctx.method} ${ctx.originalUrl}`;
      const requestBody = `${Array.isArray(ctx.request.body) ? 'array' : 'object'} ${JSON.stringify(ctx.request.body)}`;
      console.log(`${requestInfo} - Request Body: ${requestBody}`);
    }
    try {
      await next(); // pass control to the next function specified in .use()
      ctx.body = JSON.stringify(ctx.body, formatBigintDecimal);
      if (!ctx.originalUrl.includes('healthcheck')) {
        console.log(
          `${new Date().toISOString()} [success] ${ctx.method} ${ctx.originalUrl} - ${ctx.status} - Response Body: ${ctx.body}`
        );
      }
    } catch (err) {
      if (!(err instanceof Error)) {
        err = new Error(err);
      }
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.showMessage ? err.message : 'Internal Server Error.',
        reference_id: Math.floor(Math.random() * 1000000)
      };
      // Include a reference number in the logs so it can be found easily
      console.log(`ref ${ctx.body.reference_id}`);
      ctx.app.emit('error', err, ctx);

      console.log(`${new Date().toISOString()} [failure] ${ctx.method} ${ctx.originalUrl}`);
    }
  });

  app.use(priceRoutes.routes());
  app.use(priceRoutes.allowedMethods());
  app.use(coingeckoRoutes.routes());
  app.use(coingeckoRoutes.allowedMethods());
  app.use(siloRoutes.routes());
  app.use(siloRoutes.allowedMethods());
  app.use(snapshotRoutes.routes());
  app.use(snapshotRoutes.allowedMethods());

  const router = new Router();
  router.get('/healthcheck', async (ctx) => {
    ctx.body = 'healthy';
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}
appStartup();

// Unhandled promise rejection handler prevents api restart under those circumstances.
// Ideally potential promise rejections are handled locally but that may not be the case.
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
