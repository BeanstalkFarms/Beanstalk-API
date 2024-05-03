const Router = require('koa-router');
const { getTickers } = require('../service/coingecko-service');
const router = new Router({
  prefix: '/basin'
});

/**
 * Gets basin tickers according to the coingecko api integration specification
 * https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
 */
router.get('/tickers', async ctx => {
  const tickers = await getTickers();
  ctx.body = tickers;
});

// Note that /orderbook endpoint is not required since the current Well implementation is an AMM mirroring Uniswap V2

module.exports = router;
