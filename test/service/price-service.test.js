const BlockUtil = require('../../src/utils/block');

const { getBeanPrice, getEthPrice } = require('../../src/service/price-service');
const { BigNumber } = require('alchemy-sdk');
const ContractGetters = require('../../src/datasources/contracts/contract-getters');

const defaultOptions = { blockNumber: 19000000 };

describe('PriceService', () => {
  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockFromOptions').mockResolvedValue(mockBlock);
  });

  it('should fetch and format Bean price data correctly', async () => {
    const mockPrice = {
      callStatic: {
        price: jest.fn().mockResolvedValue({
          price: BigNumber.from('997747'),
          liquidity: BigNumber.from('27676822893057'),
          deltaB: BigNumber.from('-16781104856')
        })
      }
    };
    jest.spyOn(ContractGetters, 'asyncPriceContractGetter').mockResolvedValue(mockPrice);

    const price = await getBeanPrice(defaultOptions);
    expect(price.usdPrice).toEqual(0.9977);
    expect(price.liquidityUSD).toEqual(27676822.89);
    expect(price.deltaB).toEqual(-16781);
  });

  it('should fetch and format WETH price correctly', async () => {
    mockPrice = {
      callStatic: {
        getUsdPrice: jest.fn().mockResolvedValue(BigNumber.from('390100082091451'))
      }
    };
    jest.spyOn(ContractGetters, 'asyncUsdOracleContractGetter').mockResolvedValue(mockPrice);

    const price = await getEthPrice(defaultOptions);
    expect(price.usdPrice).toBeCloseTo(2563.44);
  });
});