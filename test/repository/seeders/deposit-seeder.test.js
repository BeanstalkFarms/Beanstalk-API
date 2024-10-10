const { C } = require('../../../src/constants/runtime-constants');
const AlchemyUtil = require('../../../src/datasources/alchemy');
const Contracts = require('../../../src/datasources/contracts/contracts');
const DepositRepository = require('../../../src/repository/postgres/queries/deposit-repository');
const DepositSeeder = require('../../../src/repository/postgres/startup-seeders/deposit-seeder');
const SiloService = require('../../../src/service/silo-service');
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

    jest.spyOn(SiloService, 'getWhitelistedTokenSettings').mockResolvedValue({
      [C().BEAN]: {
        valuesTbd: 5n
      }
    });

    const mockBeanstalk = {
      getLastMowedStem: jest.fn().mockImplementation((token) => {
        return 5n;
      })
    };
    jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    await DepositSeeder.run();
  });
});
