const { sequelize } = require('../repository/postgres/models');
const DepositModelAssembler = require('../repository/postgres/models/assemblers/deposit-assembler');
const DepositRepository = require('../repository/postgres/queries/deposit-repository');
const MetaRepository = require('../repository/postgres/queries/meta-repository');
const TokenRepository = require('../repository/postgres/queries/token-repository');

class DepositService {
  static async updateDeposits(depositDtos) {
    const tokenModels = await TokenRepository.findWhitelistedTokens({ where: { chain: C().CHAIN } });
    const models = depositDtos.map((d) => DepositModelAssembler.toModel(d, tokenModels));
    await sequelize.transaction(async (transaction) => {
      await DepositRepository.upsertDeposits(models, { transaction });
      await MetaRepository.update(
        C().CHAIN,
        {
          lastDepositUpdate: seedBlock
        },
        { transaction }
      );
    });
  }
}
module.exports = DepositService;
