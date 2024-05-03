
const { getBeanPrice } = require("../src/service/price-service");

jest.mock("../src/datasources/contracts", () => ({
  ...jest.requireActual("../src/datasources/contracts"),
  asyncPriceV1ContractGetter: jest.fn()
}));

jest.mock("../src/utils/block", () => ({
  ...jest.requireActual("../src/utils/block"),
  blockFromOptions: jest.fn()
}));

const { asyncPriceV1ContractGetter } = require("../src/datasources/contracts");
const { blockFromOptions } = require("../src/utils/block");
const { BigNumber } = require("alchemy-sdk");

describe('PriceService', () => {

  it('should fetch and format price data correctly', async () => {

    const mockBlock = {
      number: 19000000,
      timestamp: 1705173443
    };
    blockFromOptions.mockResolvedValue(mockBlock);

    const mockPrice = {
      callStatic: {
        price: jest.fn().mockResolvedValue({
          price: BigNumber.from("997747"),
          liquidity: BigNumber.from("27676822893057"),
          deltaB: BigNumber.from("-16781104856"),
        })
      }
    };
    asyncPriceV1ContractGetter.mockResolvedValue(mockPrice);
    
    const price = await getBeanPrice({ blockNumber: 19000000 });
    expect(price.price).toEqual(0.9977);
    expect(price.liquidityUSD).toEqual(27676822.89);
    expect(price.deltaB).toEqual(-16781);

  });
});
