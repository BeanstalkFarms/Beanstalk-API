const { BigNumber } = require('alchemy-sdk');
const { TEN_BN, MILESTONE, ZERO_BN } = require('../../src/constants/constants');
const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require('../../src/service/silo-service');
const BlockUtil = require('../../src/utils/block');
const subgraphClient = require('../../src/datasources/subgraph-client');
const { BEAN, UNRIPE_BEAN, UNRIPE_LP } = require('../../src/constants/addresses');
const ContractGetters = require('../../src/datasources/contracts/contract-getters');

const defaultOptions = { blockNumber: 19000000 };

const whitelistedSGResponse = require('../mock-responses/subgraph/silo-service/whitelistedTokens.json');

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
      callStatic: {
        balanceOfGrownStalk: jest.fn().mockImplementation((account, asset) => {
          if (account == accounts[0]) {
            return BigNumber.from(50).mul(TEN_BN.pow(10));
          } else {
            return BigNumber.from(15).mul(TEN_BN.pow(10));
          }
        })
      }
    };

    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(whitelistedSGResponse);
    jest.spyOn(ContractGetters, 'getBeanstalkContract').mockResolvedValue(mockBeanstalk);

    const grownStalk = await getMigratedGrownStalk(accounts, defaultOptions);

    expect(grownStalk.total).toEqual(325);
    expect(grownStalk.accounts[0].account).toEqual(accounts[0]);
    expect(grownStalk.accounts[1].total).toEqual(75);
  });

  it('should fetch pre-silov3 grown stalk', async () => {
    const accounts = ['0xabcd', '0x1234'];

    const siloSGResponse = require('../mock-responses/subgraph/silo-service/depositedBdvs.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(siloSGResponse);
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(whitelistedSGResponse);

    const mockBeanstalk = {
      callStatic: {
        stemTipForToken: jest.fn().mockImplementation((token, options) => {
          if (options.blockTag == MILESTONE.siloV3 || token == UNRIPE_BEAN || token == UNRIPE_LP) {
            return ZERO_BN;
          } else {
            return BigNumber.from(10000);
          }
        }),
        balanceOfGrownStalkUpToStemsDeployment: jest.fn().mockImplementation((account) => {
          if (account == accounts[0]) {
            return BigNumber.from(5000).mul(TEN_BN.pow(10));
          } else {
            return BigNumber.from(150000).mul(TEN_BN.pow(10));
          }
        })
      }
    };

    jest.spyOn(ContractGetters, 'getBeanstalkContract').mockResolvedValue(mockBeanstalk);

    const grownStalk = await getUnmigratedGrownStalk(accounts, defaultOptions);
    // console.log(JSON.stringify(grownStalk));

    expect(grownStalk.total).toEqual(155640);
    expect(grownStalk.accounts[0].total).toEqual(150505);
    expect(grownStalk.accounts[0].afterStemsDeployment[BEAN]).toEqual(500);
    expect(grownStalk.accounts[1].total).toEqual(5135);
    expect(grownStalk.accounts[1].afterStemsDeployment[UNRIPE_LP]).toEqual(0);
  });
});
