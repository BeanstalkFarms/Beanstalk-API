const { C } = require('../../../src/constants/runtime-constants');
const AlchemyUtil = require('../../../src/datasources/alchemy');
const Contracts = require('../../../src/datasources/contracts/contracts');
const DepositRepository = require('../../../src/repository/postgres/queries/deposit-repository');
const DepositSeeder = require('../../../src/repository/postgres/startup-seeders/deposit-seeder');
const DepositService = require('../../../src/service/deposit-service');
const SiloService = require('../../../src/service/silo-service');
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

    const whitelistInfoResponse = require('../../mock-responses/service/whitelistedTokenInfo.json');
    jest.spyOn(SiloService, 'getWhitelistedTokenInfo').mockResolvedValue(allToBigInt(whitelistInfoResponse));

    const mockBeanstalk = {
      getLastMowedStem: jest.fn().mockImplementation((token) => {
        return 0n;
      })
    };
    jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    const bdvsSpy = jest
      .spyOn(SiloService, 'batchBdvs')
      .mockResolvedValue(depositsResponse.siloDeposits.map((d) => 123456n));

    jest.spyOn(DepositService, 'updateDeposits').mockImplementation(() => {});

    await DepositSeeder.run();

    const bdvsCalldata = {
      tokens: depositsResponse.siloDeposits.map((d) => d.token),
      amounts: depositsResponse.siloDeposits.map((d) => BigInt(d.depositedAmount))
    };
    expect(bdvsSpy).toHaveBeenCalledWith(bdvsCalldata, 50);
  });
});
