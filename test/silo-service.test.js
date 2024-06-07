jest.mock("../src/datasources/contracts", () => ({
  ...jest.requireActual("../src/datasources/contracts"),
  asyncBeanstalkContractGetter: jest.fn()
}));
const { BigNumber } = require("alchemy-sdk");
const { asyncBeanstalkContractGetter } = require("../src/datasources/contracts");
const { TEN_BN, MILESTONE, ZERO_BN } = require("../src/constants/constants");
const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require("../src/service/silo-service");
const BlockUtil = require("../src/utils/block");
const subgraphClient = require("../src/datasources/subgraph-client");
const { BEAN, BEAN3CRV, UNRIPE_BEAN, UNRIPE_LP } = require("../src/constants/addresses");

const defaultOptions = { blockNumber: 19000000 };

describe('SiloService', () => {

  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue(mockBlock);
  });

  it('should fetch silov3 grown stalk for requested stalkholders', async () => {

    const accounts = ["0xabcd", "0x1234"];
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
    
    asyncBeanstalkContractGetter.mockResolvedValue(mockBeanstalk);

    const grownStalk = await getMigratedGrownStalk(accounts, defaultOptions);
    // console.log(grownStalk);

    expect(grownStalk.total).toEqual(325);
    expect(grownStalk.accounts[0].account).toEqual(accounts[0]);
    expect(grownStalk.accounts[1].total).toEqual(75);
  });

  it('should fetch pre-silov3 grown stalk', async () => {

    const accounts = ["0xabcd", "0x1234"];

    const siloSGResponse = JSON.parse('{"silos":[{"id":"0xabcd","stalk":"10","assets":[{"token":"0x1bea0050e63e05fbb5d8ba2f10cf5800b6224449","depositedBDV":"50000000"},{"token":"0x1bea3ccd22f4ebd3d37d731ba31eeca95713716d","depositedBDV":"80000000"},{"token":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","depositedBDV":"50000000"},{"token":"0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49","depositedBDV":"85000000"}]},{"id":"0x1234","stalk":"10","assets":[{"token":"0x1bea0050e63e05fbb5d8ba2f10cf5800b6224449","depositedBDV":"0"},{"token":"0x1bea3ccd22f4ebd3d37d731ba31eeca95713716d","depositedBDV":"0"},{"token":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","depositedBDV":"500000000"},{"token":"0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49","depositedBDV":"5000000"}]}]}');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(siloSGResponse);

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
    
    asyncBeanstalkContractGetter.mockResolvedValue(mockBeanstalk);

    const grownStalk = await getUnmigratedGrownStalk(accounts, defaultOptions);
    // console.log(JSON.stringify(grownStalk));

    expect(grownStalk.total).toEqual(155640);
    expect(grownStalk.accounts[0].total).toEqual(150505);
    expect(grownStalk.accounts[0].afterStemsDeployment[BEAN]).toEqual(500);
    expect(grownStalk.accounts[1].total).toEqual(5135);
    expect(grownStalk.accounts[1].afterStemsDeployment[UNRIPE_LP]).toEqual(0);
  }); 
});
