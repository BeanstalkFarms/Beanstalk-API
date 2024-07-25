require('dotenv').config();
const priceRoutes = require('./routes/price-routes.js');
const coingeckoRoutes = require('./routes/coingecko-routes.js');
const siloRoutes = require('./routes/silo-routes.js');
const subgraphRoutes = require('./routes/subgraph-routes.js');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const cors = require('@koa/cors');
const { activateJobs } = require('./scheduled/cron-schedule.js');
const { sequelize } = require('./repository/postgres/models/index.js');

async function appStartup() {
  // Activate whichever cron jobs are configured, if any
  const cronJobs = process.env.ENABLED_CRON_JOBS?.split(',');
  if (cronJobs && (cronJobs.length > 1 || cronJobs[0] != '')) {
    activateJobs(cronJobs);
  }

  // Update database schema. Note that this is unsafe for production use, as Migrations
  // should be used instead, but this may be sufficient for the purposes of this program.
  // (revisit this)
  console.log('Calling sequelize.sync({ alter: true })...');
  await sequelize.sync({ alter: true });
  console.log('Database schema synchronized with model definitions.');

  const app = new Koa();

  app.use(
    cors({
      origin: '*'
    })
  );

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    if (!ctx.originalUrl.includes('healthcheck')) {
      const requestInfo = `${new Date().toISOString()} [request] ${ctx.method} ${ctx.originalUrl}`;
      const requestBody = `${Array.isArray(ctx.request.body) ? 'array' : 'object'} ${JSON.stringify(ctx.request.body)}`;
      console.log(`${requestInfo} - Request Body: ${requestBody}`);
    }
    try {
      await next(); // pass control to the next function specified in .use()
      const responseBody = JSON.stringify(ctx.body);
      if (!ctx.originalUrl.includes('healthcheck')) {
        console.log(
          `${new Date().toISOString()} [success] ${ctx.method} ${ctx.originalUrl} - ${ctx.status} - Response Body: ${responseBody}`
        );
      }
    } catch (err) {
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
  app.use(subgraphRoutes.routes());
  app.use(subgraphRoutes.allowedMethods());

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
