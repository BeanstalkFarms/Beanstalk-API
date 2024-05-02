const { getBeanPrice } = require('./service/misc');

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.get('/', async ctx => {
  ctx.body = 'Hello, World!';
});

router.post('/messages', async ctx => {
  const message = ctx.request.body.message;
  ctx.body = { message: `You sent: ${message}` };
});

/**
 * Gets the current bean price
 * ?blockNumber: gets the price at the specified block number
 * ?timestamp: gets the price at the specified timestamp
 */
router.get('/price', async ctx => {
  const options = parseQuery(ctx.query);
  const price = await getBeanPrice(options);
  ctx.body = price;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// TODO: have a set of predetermined names that choose whether it needs to parse to int or not.
// This will become relevant as more query parameters get added.
function parseQuery(query) {
  const retval = {};
  for (const property in query) {
    retval[property] = parseInt(query[property]);
  }
  return retval;
}