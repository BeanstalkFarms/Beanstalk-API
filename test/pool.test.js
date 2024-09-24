const ConstantProductWellUtil = require('../src/utils/pool/constant-product');

describe('Pool Math', () => {
  describe('CP2', () => {
    test('should calculate correct token prices in constant product pool', async () => {
      const prices = ConstantProductWellUtil.calcPrice([13834969782037n, 4519904117717436850412n], [6, 18]);

      expect(prices.raw[0]).toEqual(326701408743658n);
      expect(prices.raw[1]).toEqual(3060898953n);
      expect(prices.float[0]).toBeCloseTo(0.000326701408743658);
      expect(prices.float[1]).toBeCloseTo(3060.898953);
    });

    test('should calculate liquidity depth in constant product pool', async () => {
      const reserves = [14327543308971n, 3915916427871363595968n];
      const decimals = [6, 18];
      const percent = 40;
      const buyMultiple = (100 + percent) / 100;
      const sellMultiple = (100 - percent) / 100;

      const priceBefore = ConstantProductWellUtil.calcPrice(reserves, decimals);
      const depth = ConstantProductWellUtil.calcDepth(reserves, decimals, percent);

      const priceAfterBuy0 = ConstantProductWellUtil.calcPrice(
        [
          reserves[0] - depth.buy.raw[0],
          ConstantProductWellUtil.calcMissingReserve(reserves, reserves[0] - depth.buy.raw[0])
        ],
        decimals
      );
      const priceAfterSell1 = ConstantProductWellUtil.calcPrice(
        [
          ConstantProductWellUtil.calcMissingReserve(reserves, reserves[1] + depth.sell.raw[1]),
          reserves[1] + depth.sell.raw[1]
        ],
        decimals
      );

      expect(priceBefore.float[0] * buyMultiple).toBeCloseTo(priceAfterBuy0.float[0], 10);
      expect(priceBefore.float[1] * sellMultiple).toBeCloseTo(priceAfterSell1.float[1]);
    });
  });
  describe('Stable2', () => {});
});
