const YieldModelAssembler = require('../../repository/postgres/models/assemblers/yield-assembler');
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
    const tokenModels = await SiloService.updateWhitelistedTokenInfo();

    SiloApyService.saveSeasonalApys({ tokenModels });
  }
}

module.exports = SunriseTask;
