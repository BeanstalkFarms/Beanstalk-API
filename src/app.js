const priceRoutes = require('./routes/price-routes.js');
const coingeckoRoutes = require('./routes/coingecko-routes.js');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const app = new Koa();

app.use(bodyParser());

app.use(priceRoutes.routes());
app.use(priceRoutes.allowedMethods());
app.use(coingeckoRoutes.routes());
app.use(coingeckoRoutes.allowedMethods());

const router = new Router();
router.get('/healthcheck', async ctx => {
  console.log('healthcheck requested');
  ctx.body = "healthy";
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
