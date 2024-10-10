const Router = require('koa-router');
const { getTickers, getTrades } = require('../service/coingecko-service');
const RestParsingUtil = require('../utils/rest-parsing');
const InputError = require('../error/input-error');

const router = new Router({
  prefix: '/basin'
});

/**
 * Gets basin tickers according to the coingecko api integration specification
 * https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
 */
router.get('/tickers', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  const tickers = await getTickers(options);
  ctx.body = tickers;
});

/**
 * Gets basin historical trades according to the coingecko api integration specification
 * https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
 */
router.get('/historical_trades', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  if (!options.ticker_id) {
    throw new InputError('Required parameter not provided');
  }

  // Defaults for optional variables
  options.limit = options.limit ?? 500;
  options.end_time = Math.floor((options.end_time ?? new Date()).getTime() / 1000);
  options.start_time = Math.floor(
    (options.start_time?.getTime() ?? options.end_time * 1000 - 7 * 24 * 60 * 60 * 1000) / 1000
  );

  const trades = await getTrades(options);
  ctx.body = trades;
});

// Note that /orderbook endpoint is not required since the current Well implementation is an AMM mirroring Uniswap V2

module.exports = router;
