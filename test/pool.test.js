const { CP2 } = require('../src/constants/addresses');
const ContractGetters = require('../src/datasources/contracts/contract-getters');
const ConstantProductWellUtil = require('../src/utils/pool/constant-product');
const LiquidityUtil = require('../src/utils/pool/liquidity');
const WellFnUtil = require('../src/utils/pool/well-fn');

describe('Pool Math', () => {
  test('Liquidity depth', async () => {
    const reserves = [14263546671971n, 2216675511188549508768n];
    const decimals = [6, 18];

    const rates = await WellFnUtil.getRates(reserves, '0x', CP2, decimals);
    console.log(rates);
    const trueDepth = await LiquidityUtil.depth(reserves, rates, decimals);
    const oldDepth = ConstantProductWellUtil.calcDepth(reserves, decimals);

    console.log(trueDepth, oldDepth);
  });
  test('Liquidity event volume', async () => {
    const prevLp = 38729833462074168851n;
    const newLp = 54772255750516611345n;
    const deltaLp = newLp - prevLp;
    const calcLPTokenUnderlyingMock = jest.fn().mockResolvedValueOnce([878679656n, 292893218813452475n]);
    jest.spyOn(ContractGetters, 'getWellFunctionContract').mockResolvedValue({
      callStatic: {
        calcLpTokenSupply: jest.fn().mockResolvedValueOnce(prevLp).mockResolvedValueOnce(newLp),
        calcLPTokenUnderlying: calcLPTokenUnderlyingMock
      }
    });

    const result = await WellFnUtil.calcLiquidityVolume(
      [1500n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)],
      [3000n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)]
    );

    expect(calcLPTokenUnderlyingMock).toHaveBeenCalledWith(deltaLp, expect.any(Array), newLp, expect.any(String));
    expect(result[0]).toEqual(-621320344n);
    expect(result[1]).toEqual(292893218813452475n);
  });
  describe('Off-chain calculations', () => {
    test('Constant product rate', async () => {
      const prices = ConstantProductWellUtil.calcRate([13834969782037n, 4519904117717436850412n], [6, 18]);

      expect(prices.raw[0]).toEqual(326701408743658n);
      expect(prices.raw[1]).toEqual(3060898953n);
      expect(prices.float[0]).toBeCloseTo(0.000326701408743658);
      expect(prices.float[1]).toBeCloseTo(3060.898953);
    });
  });
});
