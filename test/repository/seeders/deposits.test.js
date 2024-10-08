const { C } = require('../../../src/constants/runtime-constants');
const AlchemyUtil = require('../../../src/datasources/alchemy');
const DepositRepository = require('../../../src/repository/postgres/queries/deposit-repository');
const DepositSeeder = require('../../../src/repository/postgres/startup-seeders/deposit-seeder');
const { mockBeanstalkSG } = require('../../util/mock-sg');

describe('Deposit Seeder', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(DepositRepository, 'numRows').mockResolvedValue(0);
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: 50 })
    });
  });
  test('Seeds all deposits', async () => {
    const depositsResponse = require('../../mock-responses/subgraph/silo-service/allDeposits.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(depositsResponse);

    await DepositSeeder.run();
  });
});
