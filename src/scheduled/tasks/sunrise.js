const { sequelize } = require('../../repository/postgres/models');
const { ApyInitType } = require('../../repository/postgres/models/types/types');
const YieldRepository = require('../../repository/postgres/queries/yield-repository');
const SiloApyService = require('../../service/silo-apy');
const SiloService = require('../../service/silo-service');
const OnSunriseUtil = require('../util/on-sunrise');

class SunriseTask {
  static async handleSunrise() {
    console.log('[handleSunrise] Waiting for sunrise to be processed by subgraphs...');
    await OnSunriseUtil.waitForSunrise();
    console.log('[handleSunrise] Sunrise was processed by the subgraphs, proceeding.');

    // Update whitelisted token info
    const tokens = await SiloService.updateWhitelistedTokenInfo();
    const tokenAddrs = tokens.map((t) => t.token.toLowerCase());

    // Calculate latest yields
    const [latestAvgApy, latestNewApy] = await Promise.all([
      SiloApyService.getApy({
        tokens: tokenAddrs,
        options: {
          initType: ApyInitType.AVERAGE
        }
      }),
      SiloApyService.getApy({
        tokens: tokenAddrs,
        options: {
          initType: ApyInitType.NEW
        }
      })
    ]);

    // Prepare rows
    const addYieldRows = (results, initType) => {
      for (const window in results.yields) {
        for (const tokenAddr in results.yields[window]) {
          yieldRows.push({
            tokenId: tokens.find((t) => t.token.toLowerCase() === tokenAddr).id,
            season: results.season,
            emaWindow: parseInt(window),
            emaBeans: BigInt(results.emaBeans[window]),
            initType: initType,
            beanYield: results.yields[window][tokenAddr].bean,
            stalkYield: results.yields[window][tokenAddr].stalk,
            ownershipYield: results.yields[window][tokenAddr].ownership
          });
        }
      }
    };
    const yieldRows = [];
    addYieldRows(latestAvgApy, ApyInitType.AVERAGE);
    addYieldRows(latestNewApy, ApyInitType.NEW);

    // Save new yields
    await sequelize.transaction(async (transaction) => {
      return await YieldRepository.addYields(yieldRows, { transaction });
    });
  }
}

module.exports = SunriseTask;
