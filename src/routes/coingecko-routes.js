const Router = require('koa-router');
const { getTickers } = require('../service/coingecko-service');
const router = new Router({
  prefix: '/basin'
});

router.get('/tickers', async ctx => {
  const tickers = await getTickers();
  ctx.body = `coingecko placeholder ${ctx.params.id}`;
});

// Note that /orderbook endpoint is not required since the current Well implementation is an AMM mirroring Uniswap V2

module.exports = router;
