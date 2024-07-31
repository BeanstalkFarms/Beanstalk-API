const SiloService = require('../../service/silo-service');
const OnSunriseUtil = require('../util/on-sunrise');

class SunriseTask {
  static async handleSunrise() {
    await OnSunriseUtil.waitForSunrise();
    console.log('[handleSunrise] Sunrise was processed by the subgraphs, proceeding.');

    await SiloService.updateWhitelistedTokenInfo();
  }
}

module.exports = SunriseTask;
