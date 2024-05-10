const { getGrownStalk } = require('../service/silo-service');
const RestParsingUtil = require('../utils/rest-parsing');

const Router = require('koa-router');
const router = new Router({
  prefix: '/silo'
});

/**
 * Gets the amount of grown stalk for the requested wallets.
 * Wallets should be providede in the body as a list of strings.
 * Can optionally provide blockNumber/timestamp query params to compute this at
 */
router.post('/grown-stalk', async ctx => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  console.log(ctx.request.body);
  const results = await getGrownStalk(ctx.request.body, options);
  ctx.body = results;
});

module.exports = router;
