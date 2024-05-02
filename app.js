const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.get('/', async ctx => {
  ctx.body = 'Hello, World!';
});

router.post('/messages', async ctx => {
  const message = ctx.request.body.message;
  ctx.body = { message: `You sent: ${message}` };
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
