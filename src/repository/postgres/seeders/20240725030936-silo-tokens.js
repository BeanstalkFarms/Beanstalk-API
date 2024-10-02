'use strict';

const { get } = require('../../../datasources/contracts/contract-getters');
const db = require('../models');
const ContractGetters = require('../../../datasources/contracts/contract-getters');
const { C } = require('../../../constants/runtime-constants');
const AlchemyUtil = require('../../../datasources/alchemy');
const PromiseUtil = require('../../../utils/promise');

const c = C('eth');
const tokens = [c.BEAN, c.BEANWETH, c.BEANWSTETH, c.BEAN3CRV, c.UNRIPE_BEAN, c.UNRIPE_LP];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await AlchemyUtil.ready(c.CHAIN);
    const beanstalk = await ContractGetters.getBeanstalk(c);

    // Gets tokens that have already been populated
    const existingTokens = await db.sequelize.models.Token.findAll({
      where: {
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
        const erc20 = await get(token);
        const [name, symbol, decimals] = await Promise.all([
          erc20.name(),
          erc20.symbol(),
          (async () => Number(await erc20.decimals()))()
        ]);
        const [bdv, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] = await Promise.all(
          [
            (async () => BigInt(await beanstalk.bdv(token, BigInt(10 ** decimals))))(),
            (async () => {
              const tokenSettings = await beanstalk.tokenSettings(token);
              return BigInt(tokenSettings.stalkEarnedPerSeason);
            })(),
            (async () => BigInt(await beanstalk.stemTipForToken(token)))(),
            (async () => BigInt(await beanstalk.getTotalDeposited(token)))(),
            (async () => BigInt(await beanstalk.getTotalDepositedBdv(token)))()
            // If any revert, they return null instead
          ].map(PromiseUtil.nullOnReject)
        );
        rows.push({
          address: token,
          name,
          symbol,
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
    await queryInterface.bulkDelete('token', {
      address: {
        [Sequelize.Op.in]: tokens
      }
    });
  }
};
