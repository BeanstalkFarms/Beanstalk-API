const { C } = require('../constants/runtime-constants');
const DepositModelAssembler = require('../repository/postgres/models/assemblers/deposit-assembler');
const DepositRepository = require('../repository/postgres/queries/deposit-repository');
const MetaRepository = require('../repository/postgres/queries/meta-repository');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const AsyncContext = require('../utils/async/context');

class DepositService {
  static async updateDeposits(depositDtos, fromBlock) {
    const tokenModels = await TokenRepository.findWhitelistedTokens({ where: { chain: C().CHAIN } });
    const models = depositDtos.map((d) => DepositModelAssembler.toModel(d, tokenModels));
    await AsyncContext.sequelizeTransaction(async () => {
      await DepositRepository.upsertDeposits(models);
      await MetaRepository.update(C().CHAIN, {
        lastDepositUpdate: fromBlock
      });
    });
  }
}
module.exports = DepositService;
