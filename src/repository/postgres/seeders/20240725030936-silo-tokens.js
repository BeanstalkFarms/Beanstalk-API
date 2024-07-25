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
const { getBeanstalkContract, getERC20Contract } = require('../../../datasources/contracts/contract-getters');
const ContractStorage = require('@beanstalk/contract-storage');
const storageLayout = require('../../../datasources/storage/beanstalk/StorageBIP47.json');
const { providerThenable } = require('../../../datasources/alchemy');
const db = require('../models');

const tokens = [BEAN, BEANWETH, BEANWSTETH, BEAN3CRV, UNRIPE_BEAN, UNRIPE_LP];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const beanstalk = await getBeanstalkContract();
    const bs = new ContractStorage(await providerThenable, BEANSTALK, storageLayout);

    // Gets tokens that have already been populated
    const existingTokens = await db.sequelize.models.Token.findAll({
      where: {
        token: {
          [Sequelize.Op.in]: tokens
        }
      },
      attributes: ['token']
    });

    // Add new tokens only
    const newTokens = tokens.filter((token) => !existingTokens.some((t) => t.token === token));
    if (newTokens.length > 0) {
      const rows = [];
      for (const token of newTokens) {
        const erc20 = await getERC20Contract(token);
        const [name, symbol, decimals, stalkEarnedPerSeason, stemTip] = await Promise.all([
          erc20.callStatic.name(),
          erc20.callStatic.symbol(),
          (async () => BigInt(await erc20.callStatic.decimals()))(),
          bs.s.ss[token].stalkEarnedPerSeason,
          (async () => BigInt(await beanstalk.callStatic.stemTipForToken(token)))()
        ]);
        rows.push({
          token,
          name,
          symbol,
          decimals,
          is_whitelisted: true,
          stalk_earned_per_season: stalkEarnedPerSeason,
          stem_tip: stemTip,
          created_at: new Date(),
          updated_at: new Date()
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
