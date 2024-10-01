'use strict';

const { get } = require('../../../datasources/contracts/contract-getters');
const db = require('../models');
const EVM = require('../../../datasources/evm');

const tokens = [C().BEAN, C().BEANWETH, C().BEANWSTETH, C().BEAN3CRV, C().UNRIPE_BEAN, C().UNRIPE_LP];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { beanstalk, bs } = await EVM.beanstalkContractAndStorage();

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
        const [name, symbol, decimals, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] =
          await Promise.all([
            erc20.name(),
            erc20.symbol(),
            (async () => Number(await erc20.decimals()))(),
            bs.s.ss[token].stalkEarnedPerSeason,
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
