const { getBeanPrice } = require('../service/price-service');
const RestParsingUtil = require('../utils/rest-parsing');

const Router = require('koa-router');
const router = new Router({
  prefix: '/price'
});

/**
 * Gets the current bean price
 * ?blockNumber: gets the price at the specified block number
 * ?timestamp: gets the price at the specified timestamp
 */
router.get('/', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  const price = await getBeanPrice(options);
  ctx.body = price;
});

module.exports = router;
