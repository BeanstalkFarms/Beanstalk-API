const AlchemyUtil = require('../../../src/datasources/alchemy');
const Contracts = require('../../../src/datasources/contracts/contracts');
const DepositRepository = require('../../../src/repository/postgres/queries/deposit-repository');
const DepositSeeder = require('../../../src/repository/postgres/startup-seeders/deposit-seeder');
const DepositService = require('../../../src/service/deposit-service');
const SiloService = require('../../../src/service/silo-service');
const AsyncContext = require('../../../src/utils/async/context');
const Log = require('../../../src/utils/logging');
const { allToBigInt } = require('../../../src/utils/number');
const { mockBeanstalkSG } = require('../../util/mock-sg');

describe('Deposit Seeder', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Log, 'info').mockImplementation(() => {});
    jest.spyOn(DepositRepository, 'numRows').mockResolvedValue(0);
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: 50 })
    });
  });
  test('Seeds all deposits', async () => {
    const depositsResponse = require('../../mock-responses/subgraph/silo-service/allDeposits.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(depositsResponse);

    const whitelistInfoResponse = allToBigInt(require('../../mock-responses/service/whitelistedTokenInfo.json'));
    jest.spyOn(SiloService, 'getWhitelistedTokenInfo').mockResolvedValue(whitelistInfoResponse);

    jest.spyOn(SiloService, 'getMowStems').mockResolvedValue(
      depositsResponse.siloDeposits.reduce((acc, next) => {
        acc[`${next.farmer.id}|${next.token}`] = 50n;
        return acc;
      }, {})
    );
    jest.spyOn(DepositService, 'batchUpdateLambdaBdvs').mockImplementation(() => {});
    jest.spyOn(AsyncContext, 'sequelizeTransaction').mockImplementation(() => {});

    await DepositSeeder.run();
  });
});
