/**
 * @typedef {import('../../types/types').GetDepositsRequest} GetDepositsRequest
 * @typedef {import('../../types/types').GetDepositsResult} GetDepositsResult
 */

const { C } = require('../constants/runtime-constants');
const DepositModelAssembler = require('../repository/postgres/models/assemblers/deposit-assembler');
const DepositRepository = require('../repository/postgres/queries/deposit-repository');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const AsyncContext = require('../utils/async/context');
const AppMetaService = require('./meta-service');
const SiloService = require('./silo-service');

class DepositService {
  /**
   * Gets the requested precomputed deposit db entries
   * @param {GetDepositsRequest} request
   * @returns {Promise<GetDepositsResult>}
   */
  static async getDepositsWithOptions(request) {
    const criteriaList = [];
    request.account && criteriaList.push({ account: request.account });
    request.token && criteriaList.push({ token: request.token });

    if (!request.sort) {
      request.sort = {
        type: 'absolute',
        field: 'bdv'
      };
    }

    const { deposits, lastUpdated } = await AsyncContext.sequelizeTransaction(async () => {
      const [deposits, lambdaMeta] = await Promise.all([
        DepositRepository.findAllWithOptions({
          criteriaList,
          ...request
        }),
        AppMetaService.getLambdaMeta()
      ]);
      return { deposits, lastUpdated: lambdaMeta.lastUpdate };
    });

    const depositDtos = deposits.map((d) => {
      const dto = DepositModelAssembler.fromModel(d);
      delete dto.id;
      return dto;
    });

    return {
      lastUpdated,
      deposits: depositDtos
    };
  }

  static async getAllDeposits() {
    const deposits = await DepositRepository.findAllWithOptions({});
    const depositDtos = deposits.map((d) => DepositModelAssembler.fromModel(d));
    return depositDtos;
  }

  // Returns deposits where a subset of fields match with entries in the given list
  static async getDepositsIn(criteriaList) {
    if (criteriaList.length === 0) {
      return [];
    }
    const deposits = await DepositRepository.findAllWithOptions({ criteriaList });
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
