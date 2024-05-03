const Router = require('koa-router');
const { getTickers } = require('../service/coingecko-service');
const RestParsingUtil = require('../utils/rest-parsing');

const router = new Router({
  prefix: '/basin'
});

/**
 * Gets basin tickers according to the coingecko api integration specification
 * https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
 */
router.get('/tickers', async ctx => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  const tickers = await getTickers(options);
  ctx.body = tickers;
});

// Note that /orderbook endpoint is not required since the current Well implementation is an AMM mirroring Uniswap V2

module.exports = router;
