/**
 * @typedef {import('../../types/types').GetApyRequest} GetApyRequest
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 *
 * @typedef {import('../../types/types').GetApyHistoryRequest} GetApyHistoryRequest
 * @typedef {import('../../types/types').GetApyHistoryResult} GetApyHistoryResult
 *
 * @typedef {import('../../types/types').GetDepositsRequest} GetDepositsRequest
 * @typedef {import('../../types/types').GetDepositsResult} GetDepositsResult
 */

const InputError = require('../error/input-error');
const DepositService = require('../service/deposit-service');
const SiloApyService = require('../service/silo-apy');
const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require('../service/silo-service');
const YieldService = require('../service/yield-service');
const RestParsingUtil = require('../utils/rest-parsing');

const Router = require('koa-router');
const router = new Router({
  prefix: '/silo'
});

/**
 * Returns the calculated apy for the given request
 */
router.post('/yield', async (ctx) => {
  /** @type {GetApyRequest} */
  const body = ctx.request.body;

  // Prevents user from requesting legacy chain; season number will dictate constants
  if (ctx.query.chain) {
    throw new InputError('Query parameter `chain` is not compatible with this request.');
  }

  if (body.emaWindows && (!Array.isArray(body.emaWindows) || body.emaWindows.length === 0)) {
    throw new InputError('Invalid `emaWindows` property was provided.');
  }

  if (body.tokens && (!Array.isArray(body.tokens) || body.tokens.length === 0)) {
    throw new InputError('Invalid `tokens` property was provided.');
  }

  if (body.options?.initUserValues) {
    if (!body.tokens) {
      throw new InputError('`tokens` must be provided when `options.initUserValues` is provided.');
    }
    if (body.tokens.length !== body.options.initUserValues.length) {
      throw new InputError('Cardinality mismatch: `tokens` and `options.initUserValues`.');
    }
  }

  if (body.options?.ema) {
    if (!body.emaWindows) {
      throw new InputError('`emaWindows` must be provided when `options.ema` is provided.');
    }
    if (body.emaWindows.length !== body.options.ema.length) {
      throw new InputError('Cardinality mismatch: `emaWindows` and `options.ema`.');
    }
    for (const entry of body.options.ema) {
      entry.beansPerSeason = BigInt(entry.beansPerSeason);
    }
  }

  /** @type {CalcApysResult} */
  const results = await SiloApyService.getApy(body);
  ctx.body = results;
});

/**
 * Returns historical entries, precomputed from the database.
 * Can only return one token/window/init type per request.
 */
router.post('/yield-history', async (ctx) => {
  /** @type {GetApyHistoryRequest} */
  const body = ctx.request.body;

  if (!body.token || !body.emaWindow || !body.initType || !body.fromSeason || !body.toSeason) {
    throw new InputError('A required parameter was not provided.');
  }

  /** @type {GetApyHistoryResult} */
  const results = await YieldService.getHistoricalApy(body);
  ctx.body = results;
});

/**
 * Returns a list of silo deposits and detailed info on each
 */
router.post('/deposits', async (ctx) => {
  /** @type {GetDepositsRequest} */
  const body = ctx.request.body;

  body.account = body.account?.toLowerCase();
  body.token = body.token?.toLowerCase();

  if (
    body.sort &&
    (!['bdv', 'seeds', 'stalk'].includes(body.sort.field) || !['absolute', 'relative'].includes(body.sort.type))
  ) {
    throw new InputError('Invalid sort settings provided.');
  }

  if (body.lambdaBdvChange && !['increase', 'decrease'].includes(body.lambdaBdvChange)) {
    throw new InputError('Invalid `lambdaBdvChange` filter provided.');
  }

  if (body.limit && typeof body.limit !== 'number') {
    throw new InputError('`limit` must be a number.');
  }

  if (body.skip && typeof body.skip !== 'number') {
    throw new InputError('`skip` must be a number.');
  }

  /** @type {GetDepositsResult} */
  const results = await DepositService.getDepositsWithOptions(body);
  ctx.body = results;
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
