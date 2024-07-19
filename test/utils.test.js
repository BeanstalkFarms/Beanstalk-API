const BlockUtil = require('../src/utils/block');

// Create the provider beforehand as otherwise it would be re-created on each invocation to then
const resolvedProvider = { getBlock: async () => {} };
jest.mock('../src/datasources/alchemy', () => ({
  ...jest.requireActual('../src/datasources/alchemy'),
  providerThenable: {
    then: (resolve) => {
      resolve(resolvedProvider);
    }
  }
}));
const alchemy = require('../src/datasources/alchemy');

const { BigNumber } = require('alchemy-sdk');
const ConstantProductUtil = require('../src/utils/pool/constant-product');
const { parseQuery } = require('../src/utils/rest-parsing');
const SubgraphClients = require('../src/datasources/subgraph-client');
const { BEANSTALK } = require('../src/constants/addresses');
const { allToBigInt, fromBigInt } = require('../src/utils/number');

describe('Utils', () => {
  it('should format query parameters correctly', async () => {
    const query = {
      blockNumber: '18275926',
      timestamp: '1714694855000',
      token: 'beans!'
    };
    const parsed = parseQuery(query);

    expect(parsed.blockNumber).toEqual(18275926);
    expect(parsed.timestamp).toEqual(1714694855);
    expect(parsed.token).toEqual('beans!');
  });

  it('should maximally use block number that the subgraph has indexed', async () => {
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValue({
      _meta: {
        block: {
          number: 19500000
        }
      }
    });

    jest.spyOn(BlockUtil, 'blockFromOptions').mockResolvedValue({
      number: 19900000,
      timestamp: 1714760417
    });

    const getBlockSpy = jest.spyOn(await alchemy.providerThenable, 'getBlock').mockResolvedValue({
      number: 19500000,
      timestamp: 1714760417
    });

    const result = await BlockUtil.blockForSubgraphFromOptions(SubgraphClients.basinSG, {});

    expect(getBlockSpy).toHaveBeenCalledWith(19500000);
    expect(result.number).toEqual(19500000);
  });

  it('should calculate correct token prices in constant product pool', async () => {
    const prices = ConstantProductUtil.calcPrice(
      ['13834969782037', '4519904117717436850412'].map(BigNumber.from),
      [6, 18]
    );

    expect(prices.bn[0]).toEqual(BigNumber.from(326701408743658));
    expect(prices.bn[1]).toEqual(BigNumber.from(3060898953));
    expect(prices.float[0]).toBeCloseTo(0.000326701408743658);
    expect(prices.float[1]).toBeCloseTo(3060.898953);
  });

  it('should calculate liquidity depth in constant product pool', async () => {
    const reserves = ['14327543308971', '3915916427871363595968'].map(BigNumber.from);
    const decimals = [6, 18];
    const percent = 40;
    const buyMultiple = (100 + percent) / 100;
    const sellMultiple = (100 - percent) / 100;

    const priceBefore = ConstantProductUtil.calcPrice(reserves, decimals);
    const depth = ConstantProductUtil.calcDepth(reserves, decimals, percent);

    const priceAfterBuy0 = ConstantProductUtil.calcPrice(
      [
        reserves[0].sub(depth.buy.bn[0]),
        ConstantProductUtil.calcMissingReserve(reserves, reserves[0].sub(depth.buy.bn[0]))
      ],
      decimals
    );
    const priceAfterSell1 = ConstantProductUtil.calcPrice(
      [
        ConstantProductUtil.calcMissingReserve(reserves, reserves[1].add(depth.sell.bn[1])),
        reserves[1].add(depth.sell.bn[1])
      ],
      decimals
    );

    expect(priceBefore.float[0] * buyMultiple).toBeCloseTo(priceAfterBuy0.float[0], 10);
    expect(priceBefore.float[1] * sellMultiple).toBeCloseTo(priceAfterSell1.float[1]);
  });

  it('should find block number for a requested season', async () => {
    jest.spyOn(SubgraphClients, 'beanstalkSG').mockResolvedValue({
      seasons: [
        {
          sunriseBlock: 20042493
        }
      ]
    });

    const blockForSeason = await BlockUtil.findBlockForSeason(BEANSTALK, 22183);
    expect(blockForSeason).toBe(20042493);
  });

  it('should convert all strings to BigInt', () => {
    const obj = allToBigInt({
      p1: '123456',
      p2: 10,
      p3: {
        p4: '7890',
        p5: '0x1234',
        p6: 9275n,
        p7: 'yes',
        p8: null
      }
    });

    expect(obj.p1).toEqual(123456n);
    expect(obj.p2).toEqual(10n);
    expect(obj.p3.p4).toEqual(7890n);
    expect(obj.p3.p5).toEqual(4660n);
    expect(obj.p3.p6).toEqual(9275n);
    expect(obj.p3.p7).toEqual('yes');
    expect(obj.p3.p8).toEqual(null);
  });

  it('should retain some precision', () => {
    const n1 = fromBigInt(123456789n, 6, 2);
    expect(n1).toEqual(123.45);
    expect(() => fromBigInt(123456789n, 6, -2)).toThrow();
  });
});
