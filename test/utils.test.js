const BlockUtil = require('../src/utils/block');

// Create the provider beforehand as otherwise it would be re-created on each invocation to then
const resolvedProvider = { getBlock: async () => {} };
jest.mock('../src/datasources/alchemy', () => ({
  providerForChain: () => ({
    then: (resolve) => {
      resolve(resolvedProvider);
    }
  })
}));
const alchemy = require('../src/datasources/alchemy');

const { parseQuery } = require('../src/utils/rest-parsing');
const SubgraphClients = require('../src/datasources/subgraph-client');
const { allToBigInt, fromBigInt } = require('../src/utils/number');
const CommonSubgraphRepository = require('../src/repository/subgraph/common-subgraph');
const { BigInt_applyPercent } = require('../src/utils/bigint');

describe('Utils', () => {
  test('Formats query parameters', async () => {
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

  test('Maximally uses block number that the subgraph has indexed', async () => {
    jest.spyOn(CommonSubgraphRepository, 'getMeta').mockResolvedValue({
      block: 19500000
    });

    jest.spyOn(BlockUtil, 'blockFromOptions').mockResolvedValue({
      number: 19900000,
      timestamp: 1714760417
    });

    const getBlockSpy = jest.spyOn(await alchemy.providerForChain(), 'getBlock').mockResolvedValue({
      number: 19500000,
      timestamp: 1714760417
    });

    const result = await BlockUtil.blockForSubgraphFromOptions(SubgraphClients.basinSG, {});

    expect(getBlockSpy).toHaveBeenCalledWith(19500000);
    expect(result.number).toEqual(19500000);
  });

  test('Find block number for a requested season', async () => {
    jest.spyOn(SubgraphClients, 'beanstalkSG').mockResolvedValue({
      seasons: [
        {
          sunriseBlock: 20042493
        }
      ]
    });

    const blockForSeason = await BlockUtil.findBlockForSeason(22183);
    expect(blockForSeason).toBe(20042493);
  });

  describe('BigInt', () => {
    test('Converts all strings to BigInt', () => {
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

    test('Retain some precision on string conversion', () => {
      const n1 = fromBigInt(123456789n, 6, 2);
      expect(n1).toEqual(123.45);
      expect(() => fromBigInt(123456789n, 6, -2)).toThrow();
    });

    test('Applies percentage', () => {
      expect(BigInt_applyPercent(100n, 102)).toEqual(102n);
      expect(BigInt_applyPercent(100n, 95)).toEqual(95n);
      expect(BigInt_applyPercent(10000n, 105.371)).toEqual(10537n);
    });
  });
});
