const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require('../../src/service/silo-service');
const BlockUtil = require('../../src/utils/block');
const {
  ADDRESSES: { BEAN, UNRIPE_BEAN, UNRIPE_LP },
  MILESTONE
} = require('../../src/constants/raw/beanstalk-eth');
const ContractGetters = require('../../src/datasources/contracts/contract-getters');

const defaultOptions = { blockNumber: 19000000 };

const whitelistedSGResponse = require('../mock-responses/subgraph/silo-service/whitelistedTokens.json');
const { mockBeanstalkSG } = require('../util/mock-sg');

describe('SiloService', () => {
  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue(mockBlock);
  });

  it('should fetch silov3 grown stalk for requested stalkholders', async () => {
    const accounts = ['0xabcd', '0x1234'];
    const mockBeanstalk = {
      balanceOfGrownStalk: jest.fn().mockImplementation((account, asset) => {
        if (account == accounts[0]) {
          return 50n * BigInt(10 ** 10);
        } else {
          return 15n * BigInt(10 ** 10);
        }
      })
    };

    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(whitelistedSGResponse);
    jest.spyOn(ContractGetters, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    const grownStalk = await getMigratedGrownStalk(accounts, defaultOptions);

    expect(grownStalk.total).toEqual(325);
    expect(grownStalk.accounts[0].account).toEqual(accounts[0]);
    expect(grownStalk.accounts[1].total).toEqual(75);
  });

  it('should fetch pre-silov3 grown stalk', async () => {
    const accounts = ['0xabcd', '0x1234'];

    const siloSGResponse = require('../mock-responses/subgraph/silo-service/depositedBdvs.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(siloSGResponse);
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(whitelistedSGResponse);

    const mockBeanstalk = {
      stemTipForToken: jest.fn().mockImplementation((token, options) => {
        if (options.blockTag == MILESTONE.siloV3Block || token == UNRIPE_BEAN || token == UNRIPE_LP) {
          return 0n;
        } else {
          return 10000n;
        }
      }),
      balanceOfGrownStalkUpToStemsDeployment: jest.fn().mockImplementation((account) => {
        if (account == accounts[0]) {
          return 5000n * BigInt(10 ** 10);
        } else {
          return 150000n * BigInt(10 ** 10);
        }
      })
    };

    jest.spyOn(ContractGetters, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    const grownStalk = await getUnmigratedGrownStalk(accounts, defaultOptions);

    expect(grownStalk.total).toEqual(155640);
    expect(grownStalk.accounts[0].total).toEqual(150505);
    expect(grownStalk.accounts[0].afterStemsDeployment[BEAN]).toEqual(500);
    expect(grownStalk.accounts[1].total).toEqual(5135);
    expect(grownStalk.accounts[1].afterStemsDeployment[UNRIPE_LP]).toEqual(0);
  });
});
