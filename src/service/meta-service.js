const { C } = require('../constants/runtime-constants');
const MetaRepository = require('../repository/postgres/queries/meta-repository');

class AppMetaService {
  static async getLastDepositUpdateBlock() {
    const meta = await MetaRepository.get(C().CHAIN);
    return meta.lastDepositUpdate;
  }
}
module.exports = AppMetaService;
