const SiloService = require('../../service/silo-service');
const YieldService = require('../../service/yield-service');
const Log = require('../../utils/logging');
const OnSunriseUtil = require('../util/on-sunrise');

class SunriseTask {
  static async handleSunrise() {
    Log.info('Waiting for sunrise to be processed by subgraphs...');
    await OnSunriseUtil.waitForSunrise();
    Log.info('Sunrise was processed by the subgraphs, proceeding.');

    // Update whitelisted token info
    const tokenModels = await SiloService.updateWhitelistedTokenInfo();

    await YieldService.saveSeasonalApys({ tokenModels });
  }
}

module.exports = SunriseTask;
