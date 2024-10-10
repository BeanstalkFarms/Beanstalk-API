const Router = require('koa-router');
const RestParsingUtil = require('../utils/rest-parsing');
const SnapshotVotingService = require('../service/snapshot-voting');
const InputError = require('../error/input-error');
const router = new Router({
  prefix: '/snapshot'
});

/**
 * Gets the governance voting power for the specified accounts and block
 * ?addresses: comma-separated EVM addresses for which to compute voting power
 * ?snapshot: the block number for which to compute voting power
 */
router.get('/voting-power', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);
  if (!options.addresses || !options.snapshot) {
    throw new InputError('Invalid request: missing required parameter(s)');
  }

  const votingPowerList = await SnapshotVotingService.getVotingPower(options.addresses, options.snapshot);
  ctx.body = {
    score: votingPowerList
  };
});

module.exports = router;
