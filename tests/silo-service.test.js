jest.mock("../src/datasources/contracts", () => ({
  ...jest.requireActual("../src/datasources/contracts"),
  asyncBeanstalkContractGetter: jest.fn()
}));
const { BigNumber } = require("alchemy-sdk");
const { asyncBeanstalkContractGetter } = require("../src/datasources/contracts");
const { TEN_BN } = require("../src/constants/constants");
const { getGrownStalk, getMigratedGrownStalk } = require("../src/service/silo-service");
const BlockUtil = require("../src/utils/block");

const defaultOptions = { blockNumber: 19000000 };

describe('SiloService', () => {

  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockFromOptions').mockResolvedValue(mockBlock);
  });

  it('should fetch silov3 grown stalk for requested stalkholders', async () => {

    const accounts = ["0xabcd", "0x1234"];
    const mockStalk = {
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
    
    asyncBeanstalkContractGetter.mockResolvedValue(mockStalk);

    const grownStalk = await getMigratedGrownStalk(accounts, defaultOptions);
    console.log(grownStalk);

    expect(grownStalk.total).toEqual(325);
    expect(grownStalk.accounts[0].account).toEqual(accounts[0]);
    expect(grownStalk.accounts[1].total).toEqual(75);
  });
});
