const Router = require('koa-router');
const router = new Router({
  prefix: '/basin'
});

router.get('/placeholder/:id', async ctx => {
  ctx.body = `coingecko placeholder ${ctx.params.id}`;
});

module.exports = router;
