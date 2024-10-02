'use strict';

const { get } = require('../../../datasources/contracts/contract-getters');
const db = require('../models');
const ContractGetters = require('../../../datasources/contracts/contract-getters');
const { C } = require('../../../constants/runtime-constants');
const AlchemyUtil = require('../../../datasources/alchemy');

const c = C('eth');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await AlchemyUtil.ready(c.CHAIN);
    const beanstalk = await ContractGetters.getBeanstalk(c);

    const tokens = [c.BEAN, c.BEANWETH, c.BEANWSTETH, c.BEAN3CRV, c.UNRIPE_BEAN, c.UNRIPE_LP];

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
        // TODO: if any of these revert, as will be the case after migration, they should be set null in the table.
        const [name, symbol, decimals, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] =
          await Promise.all([
            erc20.name(),
            erc20.symbol(),
            (async () => Number(await erc20.decimals()))(),
            (async () => {
              const tokenSettings = await beanstalk.tokenSettings(token);
              return BigInt(tokenSettings.stalkEarnedPerSeason);
            })(),
            (async () => BigInt(await beanstalk.stemTipForToken(token)))(),
            (async () => BigInt(await beanstalk.getTotalDeposited(token)))(),
            (async () => BigInt(await beanstalk.getTotalDepositedBdv(token)))()
          ]);
        const bdv = BigInt(await beanstalk.bdv(token, BigInt(10 ** decimals)));
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
      token: {
        [Sequelize.Op.in]: tokens
      }
    });
  }
};
