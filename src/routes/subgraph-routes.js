const Router = require('koa-router');
const SubgraphService = require('../service/subgraph-service');
const router = new Router({
  prefix: '/subgraph'
});

/**
 * Gets the current status of the requested subgraphs
 * ?env=(prod | dev | testing | decentralized). Comma separated for multiple. Defaults to "prod,decentralized"
 */
router.get('/status', async (ctx) => {
  const env = (ctx.query.env ?? 'prod,decentralized').split(',').map((item) => item.trim());

  const statuses = await SubgraphService.getStatuses(env);
  ctx.body = statuses;
});

module.exports = router;
