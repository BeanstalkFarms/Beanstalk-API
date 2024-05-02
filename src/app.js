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

// Unmapped properties will pass through directly
const parseMapping = {
  blockNumber: parseInt,
  timestamp: (p) => {
    // Convert to seconds if its provided in ms
    if (p.length >= 13) {
      return parseInt(p) / 1000;
    }
    return parseInt(p);
  }
}

function parseQuery(query) {
  const retval = {};
  for (const property in query) {
    retval[property] = parseMapping[property]?.call(null, query[property]) ?? query[property];
  }
  return retval;
}