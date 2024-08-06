'use strict';

const {
  BEANSTALK,
  BEAN,
  BEANWETH,
  BEANWSTETH,
  BEAN3CRV,
  UNRIPE_BEAN,
  UNRIPE_LP
} = require('../../../constants/addresses');
const { getERC20Contract } = require('../../../datasources/contracts/contract-getters');
const db = require('../models');
const EVM = require('../../../datasources/evm');

const tokens = [BEAN, BEANWETH, BEANWSTETH, BEAN3CRV, UNRIPE_BEAN, UNRIPE_LP];

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
        const erc20 = await getERC20Contract(token);
        const [name, symbol, decimals, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] =
          await Promise.all([
            erc20.callStatic.name(),
            erc20.callStatic.symbol(),
            (async () => Number(await erc20.callStatic.decimals()))(),
            bs.s.ss[token].stalkEarnedPerSeason,
            (async () => BigInt(await beanstalk.callStatic.stemTipForToken(token)))(),
            (async () => BigInt(await beanstalk.callStatic.getTotalDeposited(token)))(),
            (async () => BigInt(await beanstalk.callStatic.getTotalDepositedBdv(token)))()
          ]);
        const bdv = BigInt(await beanstalk.callStatic.bdv(token, BigInt(10 ** decimals)));
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
