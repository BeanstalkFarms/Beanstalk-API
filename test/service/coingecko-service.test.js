const SubgraphClients = require('../../src/datasources/subgraph-client');

const BlockUtil = require('../../src/utils/block');
jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue({ number: 19000000, timestamp: 1705173443 });

const {
  getTickers,
  deprecated_calcWellSwapVolume,
  getWellPriceRange,
  getTrades,
  getAllPriceChanges
} = require('../../src/service/coingecko-service');
const {
  ADDRESSES: { BEANWETH, BEANWSTETH, WETH, BEAN }
} = require('../../src/constants/raw/beanstalk-eth');
const SubgraphQueryUtil = require('../../src/utils/subgraph-query');

const testTimestamp = 1715020584;

describe('CoingeckoService', () => {
  it('should return all Basin tickers in the expected format', async () => {
    const wellsResponse = require('../mock-responses/subgraph/basin/wells.json');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);
    // NOTE: incomplete mocking in this test

    const tickers = await getTickers({ blockNumber: 19000000 });

    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker_id).toEqual(
      '0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    );
    expect(tickers[0].base_currency).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab');
    expect(tickers[0].target_currency).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].pool_id).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(tickers[0].last_price).toBeCloseTo(0.000389236771196659);
    expect(tickers[0].base_volume).toBeCloseTo(362621.652657);
    expect(tickers[0].target_volume).toBeCloseTo(141.01800893122126);
    expect(tickers[0].liquidity_in_usd).toEqual(27491580);
    expect(tickers[0].depth2.buy[0]).toEqual(135736.220357);
    expect(tickers[0].depth2.buy[1]).toBeCloseTo(52.8335281459809, 5);
    expect(tickers[0].depth2.sell[0]).toEqual(139870.493345);
    expect(tickers[0].depth2.sell[1]).toBeCloseTo(54.44273921546687, 5);
    expect(tickers[0].high).toBeCloseTo(0.000392979136931714, 5);
    expect(tickers[0].low).toBeCloseTo(0.000383640247389837, 5);
  });

  test('Returns correct high/low prices over the given period', () => {
    const mockPriceEvents = require('../mock-responses/coingecko/priceChanges.json');
    const mockWellDto = {
      address: BEANWSTETH.toLowerCase(),
      tokenDecimals: () => [6, 18]
    };

    const priceRange = getWellPriceRange(mockWellDto, mockPriceEvents);

    expect(priceRange.high.float[0]).toEqual(0.000065);
    expect(priceRange.high.float[1]).toEqual(0.00000000000175889);
    expect(priceRange.low.float[0]).toEqual(210.587245);
    expect(priceRange.low.float[1]).toEqual(0.00000001717847889);
  });

  test('Returns swap history', async () => {
    jest
      .spyOn(SubgraphClients, 'basinSG')
      .mockResolvedValueOnce(require('../mock-responses/subgraph/basin/swapHistory.json'));

    const options = {
      ticker_id: `${BEAN}_${WETH}`,
      // These technically arent necessary due to the above mocking
      limit: 10,
      start_time: 1714114912,
      end_time: 1714719712
    };
    const trades = await getTrades(options);

    expect(trades.buy.length).toEqual(1);
    expect(trades.sell.length).toEqual(9);
    expect(trades.buy[0].price).toBeCloseTo(3055.356527);
    expect(trades.buy[0].base_volume).toBeCloseTo(0.46237751579074726);
    expect(trades.buy[0].target_volume).toBeCloseTo(1412.728161);
    expect(trades.buy[0].trade_timestamp).toEqual(1714613735000);
    expect(trades.buy[0].type).toEqual('buy');
  });

  test('Identifies price changes', async () => {
    const swapsResponse = require('../mock-responses/subgraph/basin/swaps.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(swapsResponse);
    const depositResponse = require('../mock-responses/subgraph/basin/deposits.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(depositResponse);
    const withdrawResponse = require('../mock-responses/subgraph/basin/withdrawals.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(withdrawResponse);

    const mockWells = {
      [BEANWETH.toLowerCase()]: {
        tokenDecimals: () => [6, 18]
      },
      [BEANWSTETH.toLowerCase()]: {
        tokenDecimals: () => [6, 18]
      }
    };

    const priceRange = await getAllPriceChanges(mockWells, testTimestamp);
    expect(priceRange[BEANWETH.toLowerCase()].length).toEqual(5);
    expect(priceRange[BEANWSTETH.toLowerCase()].length).toEqual(2);
  });

  // This test is for a deprecated feature, the underlying query has changed, mocking is fine
  test('(deprecated) should calculate token volume in the well (calculated directly from swaps only)', async () => {
    const wellsResponse = require('../mock-responses/subgraph/basin/swapVolume.json');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);

    const volume = await deprecated_calcWellSwapVolume(BEANWETH, testTimestamp);
    expect(volume[BEAN].float).toBeCloseTo(71708.944062);
    expect(volume[WETH].float).toBeCloseTo(22.591723371417718);
  });
});
