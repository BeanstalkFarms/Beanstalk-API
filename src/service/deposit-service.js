const { C } = require('../constants/runtime-constants');
const DepositModelAssembler = require('../repository/postgres/models/assemblers/deposit-assembler');
const DepositRepository = require('../repository/postgres/queries/deposit-repository');
const MetaRepository = require('../repository/postgres/queries/meta-repository');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const AsyncContext = require('../utils/async/context');

class DepositService {
  static async getMatchingDeposits(criteriaList) {
    const deposits = await DepositRepository.findByCriteria(criteriaList);
    const depositDtos = deposits.map((d) => DepositModelAssembler.fromModel(d));
    return depositDtos;
  }
  // Updates the given deposits via upsert
  static async updateDeposits(depositDtos, updateBlock) {
    const tokenModels = await TokenRepository.findWhitelistedTokens(C().CHAIN);
    const models = depositDtos.map((d) => DepositModelAssembler.toModel(d, tokenModels));
    await AsyncContext.sequelizeTransaction(async () => {
      await DepositRepository.upsertDeposits(models);
      await MetaRepository.update(C().CHAIN, {
        lastDepositUpdate: updateBlock
      });
    });
  }

  static async removeDeposits(depositDtos) {
    const depositIds = depositDtos.map((d) => d.id);
    await DepositRepository.destroyByIds(depositIds);
  }
}
module.exports = DepositService;
