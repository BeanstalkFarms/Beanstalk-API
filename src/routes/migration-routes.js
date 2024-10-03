const fs = require('fs');
const Router = require('koa-router');
const RestParsingUtil = require('../utils/rest-parsing');
const { BEAN, BEANWETH, BEANWSTETH, BEAN3CRV, UNRIPE_BEAN, UNRIPE_LP } = require('../constants/addresses');
const { providerThenable } = require('../datasources/alchemy');

const router = new Router({
  prefix: '/migration'
});

/**
 * Gets user balances breakdown that will be used in BIP-50 migration to arbitrum.
 * This code is only relevant for this BIP, so putting it all in this one file for easy future deletion.
 */
router.get('/', async (ctx) => {
  const options = RestParsingUtil.parseQuery(ctx.query);

  const BLOCK = 20766840;
  const allDeposits = JSON.parse(fs.readFileSync(`${__dirname}/../datasources/migration/deposits${BLOCK}.json`));
  const allPods = JSON.parse(fs.readFileSync(`${__dirname}/../datasources/migration/pods${BLOCK}.json`));
  const allFertilizer = JSON.parse(fs.readFileSync(`${__dirname}/../datasources/migration/fert${BLOCK}.json`));
  const allBalances = JSON.parse(
    fs.readFileSync(`${__dirname}/../datasources/migration/internal-balances${BLOCK}.json`)
  );

  const account = options.account.toLowerCase();

  const accountResults = {
    meta: {
      account,
      block: BLOCK,
      timestamp: (await (await providerThenable).getBlock(BLOCK)).timestamp
    },
    silo: getSiloResult(allDeposits, account),
    field: getFieldResult(allPods, account),
    barn: getBarnResult(allFertilizer, account),
    farm: getFarmResult(allBalances, account)
  };

  ctx.body = accountResults;
});

function getSiloResult(allDeposits, account) {
  const deposits = [];
  let earnedBeans = 0n;
  for (const token in allDeposits.accounts[account]) {
    if (token !== 'totals') {
      for (const stem in allDeposits.accounts[account][token]) {
        deposits.push({
          token: mapTokenName(token),
          amount: BigInt(allDeposits.accounts[account][token][stem].amount),
          recordedBdv: BigInt(allDeposits.accounts[account][token][stem].bdv),
          currentStalk: BigInt(allDeposits.accounts[account][token][stem].stalk),
          stalkAfterMow: BigInt(allDeposits.accounts[account][token][stem].stalkIfMown)
        });
        if (
          token === BEAN.toLowerCase() &&
          allDeposits.accounts[account][token][stem].stalk === allDeposits.accounts[account][token][stem].stalkIfMown
        ) {
          earnedBeans += deposits[deposits.length - 1].amount;
        }
      }
    }
  }
  return {
    deposits,
    earnedBeans,
    currentStalk: deposits.reduce((a, next) => a + next.currentStalk, 0n),
    stalkAfterMow: deposits.reduce((a, next) => a + next.stalkAfterMow, 0n)
  };
}

function getFieldResult(allPods, account) {
  const plots = [];
  for (const index in allPods[account]) {
    plots.push({
      index,
      amount: BigInt(allPods[account][index].amount)
    });
  }
  return {
    plots,
    totalPods: plots.reduce((a, next) => a + next.amount, 0n)
  };
}

function getBarnResult(allFertilizer, account) {
  const fert = [];
  for (const id in allFertilizer.accounts[account]) {
    fert.push({
      fertilizerId: id,
      amount: BigInt(allFertilizer.accounts[account][id].amount),
      rinsableSprouts: BigInt(allFertilizer.accounts[account][id].rinsableSprouts),
      unrinsableSprouts: BigInt(allFertilizer.accounts[account][id].unrinsableSprouts),
      humidity: parseFloat(allFertilizer.accounts[account][id].humidity)
    });
  }
  return {
    fert,
    totalFert: fert.reduce((a, next) => a + next.amount, 0n),
    totalRinsable: fert.reduce((a, next) => a + next.rinsableSprouts, 0n),
    totalUnrinsable: fert.reduce((a, next) => a + next.unrinsableSprouts, 0n)
  };
}

function getFarmResult(allBalances, account) {
  const tokens = [];
  for (const token in allBalances.accounts[account]) {
    tokens.push({
      token: mapTokenName(token),
      currentInternal: BigInt(allBalances.accounts[account][token].currentInternal),
      withdrawn: BigInt(allBalances.accounts[account][token].withdrawn),
      unpicked: BigInt(allBalances.accounts[account][token].unpicked),
      rinsable: BigInt(allBalances.accounts[account][token].rinsable),
      total: BigInt(allBalances.accounts[account][token].total)
    });
  }
  return tokens;
}

function mapTokenName(tokenAddress) {
  if (tokenAddress === BEAN.toLowerCase()) {
    return 'Bean';
  } else if (tokenAddress === BEANWETH.toLowerCase()) {
    return 'Bean:ETH Well LP';
  } else if (tokenAddress === BEANWSTETH.toLowerCase()) {
    return 'Bean:wstETH Well LP';
  } else if (tokenAddress === BEAN3CRV.toLowerCase()) {
    return 'Bean:3CRV LP';
  } else if (tokenAddress === UNRIPE_BEAN.toLowerCase()) {
    return 'Unripe Bean';
  } else if (tokenAddress === UNRIPE_LP.toLowerCase()) {
    return 'Unripe Bean:wstETH LP';
  }
}

module.exports = router;
