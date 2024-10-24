'use strict';

const db = require('../models');
const { C } = require('../../../constants/runtime-constants');
const AlchemyUtil = require('../../../datasources/alchemy');
const PromiseUtil = require('../../../utils/async/promise');
const Contracts = require('../../../datasources/contracts/contracts');
const EnvUtil = require('../../../utils/env');

const c = C('arb');
const tokens = [
  c.BEAN,
  c.BEANWETH,
  c.BEANWSTETH,
  c.BEANWEETH,
  c.BEANWBTC,
  c.BEANUSDC,
  c.BEANUSDT,
  c.UNRIPE_BEAN,
  c.UNRIPE_LP
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!EnvUtil.isChainEnabled(c.CHAIN)) {
      console.log(`Skipping seeder: chain '${c.CHAIN}' is not enabled.`);
      return;
    }
    // Null silo data on any existing eth tokens
    await queryInterface.bulkUpdate(
      'token',
      {
        bdv: null,
        stalkEarnedPerSeason: null,
        stemTip: null,
        totalDeposited: null,
        totalDepositedBdv: null
      },
      {
        chain: 'eth'
      }
    );

    // Add arbitrum tokens
    await AlchemyUtil.ready(c.CHAIN);
    const beanstalk = Contracts.getBeanstalk(c);

    // Gets tokens that have already been populated
    const existingTokens = await db.sequelize.models.Token.findAll({
      where: {
        chain: c.CHAIN,
        address: {
          [Sequelize.Op.in]: tokens
        }
      },
      attributes: ['address']
    });

    // Add new tokens only
    const newTokens = tokens.filter((token) => !existingTokens.some((t) => t.address === token));
    if (newTokens.length > 0) {
      const rows = [];
      for (const token of newTokens) {
        const erc20 = Contracts.get(token, c);
        const [name, symbol, supply, decimals] = await Promise.all([
          erc20.name(),
          erc20.symbol(),
          erc20.totalSupply(),
          (async () => Number(await erc20.decimals()))()
        ]);
        const [bdv, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] = await Promise.all(
          [
            PromiseUtil.defaultOnReject(1n)(beanstalk.bdv(token, BigInt(10 ** decimals))),
            (async () => {
              const tokenSettings = await beanstalk.tokenSettings(token);
              return tokenSettings.stalkEarnedPerSeason;
            })(),
            beanstalk.stemTipForToken(token),
            beanstalk.getTotalDeposited(token),
            beanstalk.getTotalDepositedBdv(token)
            // If any revert, they return null instead
          ].map(PromiseUtil.defaultOnReject(null))
        );
        rows.push({
          address: token,
          chain: c.CHAIN,
          name,
          symbol,
          supply,
          decimals,
          isWhitelisted: true,
          bdv,
          stalkEarnedPerSeason,
          stemTip,
          totalDeposited,
          totalDepositedBdv,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await queryInterface.bulkInsert('token', rows);
    }
  },

  async down(queryInterface, Sequelize) {
    // Delete arbitrum tokens
    await queryInterface.bulkDelete('token', {
      address: {
        [Sequelize.Op.in]: tokens
      }
    });
  }
};
