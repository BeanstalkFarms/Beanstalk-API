const { C } = require('../constants/runtime-constants');
const MetaRepository = require('../repository/postgres/queries/meta-repository');
const { formatBigintHex } = require('../utils/bigint');
const { allToBigInt } = require('../utils/number');

class AppMetaService {
  static async getLambdaMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta.lastDepositUpdate,
      lastBdvs: allToBigInt(JSON.parse(meta.lastLambdaBdvs))
    };
  }

  static async setLastDepositUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastDepositUpdate: lastUpdate });
  }

  static async setLastLambdaBdvs(lastBdvs) {
    await MetaRepository.update(C().CHAIN, { lastLambdaBdvs: JSON.stringify(lastBdvs, formatBigintHex) });
  }
}
module.exports = AppMetaService;
