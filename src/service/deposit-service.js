const { C } = require('../constants/runtime-constants');
const DepositModelAssembler = require('../repository/postgres/models/assemblers/deposit-assembler');
const DepositRepository = require('../repository/postgres/queries/deposit-repository');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const SiloService = require('./silo-service');

class DepositService {
  static async getAllDeposits() {
    const deposits = await DepositRepository.findAllWithOptions({});
    const depositDtos = deposits.map((d) => DepositModelAssembler.fromModel(d));
    return depositDtos;
  }

  static async getMatchingDeposits(criteriaList) {
    const deposits = await DepositRepository.findAllWithOptions(criteriaList);
    const depositDtos = deposits.map((d) => DepositModelAssembler.fromModel(d));
    return depositDtos;
  }
  // Updates the given deposits via upsert
  static async updateDeposits(depositDtos) {
    const tokenModels = await TokenRepository.findWhitelistedTokens(C().CHAIN);
    const models = depositDtos.map((d) => DepositModelAssembler.toModel(d, tokenModels));
    await DepositRepository.upsertDeposits(models);
  }

  static async removeDeposits(depositDtos) {
    const depositIds = depositDtos.map((d) => d.id);
    await DepositRepository.destroyByIds(depositIds);
  }

  // Update mow stems for each deposit
  static async assignMowStems(depositDtos, blockNumber) {
    const accountTokenPairs = [];
    for (const deposit of depositDtos) {
      accountTokenPairs.push({ account: deposit.account, token: deposit.token });
    }
    const mowStems = await SiloService.getMowStems(accountTokenPairs, blockNumber);
    for (const deposit of depositDtos) {
      deposit.mowStem = mowStems[`${deposit.account}|${deposit.token}`];
    }
  }

  // Updates bdv/lambda stats on all of the given deposits
  static async batchUpdateLambdaBdvs(depositDtos, tokenInfos, blockNumber) {
    // Get current bdvs for all deposits
    const bdvsCalldata = {
      tokens: [],
      amounts: []
    };
    for (const deposit of depositDtos) {
      bdvsCalldata.tokens.push(deposit.token);
      bdvsCalldata.amounts.push(deposit.depositedAmount);
    }
    const depositLambdaBdvs = await SiloService.batchBdvs(bdvsCalldata, blockNumber);

    // Updates lambda stats
    for (let i = 0; i < depositDtos.length; ++i) {
      depositDtos[i].updateLambdaStats(depositLambdaBdvs[i], tokenInfos[depositDtos[i].token]);
    }
  }
}
module.exports = DepositService;
