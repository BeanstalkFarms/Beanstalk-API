const priceRoutes = require('./routes/price-routes.js');
const coingeckoRoutes = require('./routes/coingecko-routes.js');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const app = new Koa();

app.use(bodyParser());

app.use(priceRoutes.routes());
app.use(priceRoutes.allowedMethods());
app.use(coingeckoRoutes.routes());
app.use(coingeckoRoutes.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
