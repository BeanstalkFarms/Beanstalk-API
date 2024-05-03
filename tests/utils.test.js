const { BigNumber } = require("alchemy-sdk");
const { getConstantProductPrice } = require("../src/utils/constant-product");
const { parseQuery } = require("../src/utils/rest-parsing");

describe('Utils', () => {
  it('should format query parameters correctly', async () => {
    const query = {
      blockNumber: '18275926',
      timestamp: '1714694855000',
      token: 'beans!'
    }
    const parsed = parseQuery(query);

    expect(parsed.blockNumber).toEqual(18275926);
    expect(parsed.timestamp).toEqual(1714694855);
    expect(parsed.token).toEqual('beans!');
  });

  it('should calculate correct token prices in constant product pool', async () => {
    const prices = getConstantProductPrice(
      ["13834969782037", "4519904117717436850412"].map(BigNumber.from),
      [6, 18]
    );

    expect(prices.bn[0]).toEqual(BigNumber.from(326701408743658));
    expect(prices.bn[1]).toEqual(BigNumber.from(3060898953));
    expect(prices.float[0]).toBeCloseTo(0.000326701408743658);
    expect(prices.float[1]).toBeCloseTo(3060.898953);

  });
});
