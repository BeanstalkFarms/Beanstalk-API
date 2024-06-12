const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require('../service/silo-service');
const RestParsingUtil = require('../utils/rest-parsing');

const Router = require('koa-router');
const router = new Router({
  prefix: '/silo'
});

/**
 * Gets the amount of grown stalk for the requested wallets.
 * Wallets should be providede in the body as a list of strings.
 * Can optionally provide blockNumber/timestamp query params to compute this at
 * ?type=(migrated | unmigrated | all). Defaults to "all"
 */
router.post('/grown-stalk', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  options.type = options.type ?? 'all';

  const wallets = ctx.request.body.map((s) => s.toLowerCase());

  let results;
  switch (options.type) {
    case 'migrated':
      results = await getMigratedGrownStalk(wallets, options);
      break;
    case 'unmigrated':
      results = await getUnmigratedGrownStalk(wallets, options);
      break;
    case 'all':
      const [migrated, unmigrated] = await Promise.all([
        getMigratedGrownStalk(wallets, options),
        getUnmigratedGrownStalk(wallets, options)
      ]);
      results = {
        total: migrated.total + unmigrated.total,
        accounts: [...migrated.accounts, ...unmigrated.accounts]
      };
      results.accounts.sort((a, b) => b.total - a.total);
      break;
  }
  ctx.body = results;
});

module.exports = router;
