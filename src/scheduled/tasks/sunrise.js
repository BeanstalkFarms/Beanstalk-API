const YieldModelAssembler = require('../../repository/postgres/models/assemblers/yield-assembler');
const { ApyInitType } = require('../../repository/postgres/models/types/types');
const YieldRepository = require('../../repository/postgres/queries/yield-repository');
const SiloApyService = require('../../service/silo-apy');
const SiloService = require('../../service/silo-service');
const AsyncContext = require('../../utils/async/context');
const Log = require('../../utils/logging');
const OnSunriseUtil = require('../util/on-sunrise');

class SunriseTask {
  static async handleSunrise() {
    Log.info('Waiting for sunrise to be processed by subgraphs...');
    await OnSunriseUtil.waitForSunrise();
    Log.info('Sunrise was processed by the subgraphs, proceeding.');

    // Update whitelisted token info
    const tokens = await SiloService.updateWhitelistedTokenInfo();
    const tokenAddrs = tokens.map((t) => t.address.toLowerCase());

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
    const yieldRows = [
      ...YieldModelAssembler.toModels(latestAvgApy, ApyInitType.AVERAGE, tokens),
      ...YieldModelAssembler.toModels(latestNewApy, ApyInitType.NEW, tokens)
    ];

    // Save new yields
    await AsyncContext.sequelizeTransaction(async () => {
      return await YieldRepository.addYields(yieldRows, { transaction });
    });
  }
}

module.exports = SunriseTask;
