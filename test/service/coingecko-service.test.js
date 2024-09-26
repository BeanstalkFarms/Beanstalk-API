const SubgraphClients = require('../../src/datasources/subgraph-client');

const BlockUtil = require('../../src/utils/block');
jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue({ number: 19000000, timestamp: 1705173443 });

const {
  getTickers,
  deprecated_calcWellSwapVolume,
  getWellPriceRange,
  getTrades
} = require('../../src/service/coingecko-service');
const { BEANWETH, WETH, BEAN } = require('../../src/constants/addresses');
const SubgraphQueryUtil = require('../../src/utils/subgraph-query');

describe('CoingeckoService', () => {
  it('should return all Basin tickers in the expected format', async () => {
    const wellsResponse = require('../mock-responses/subgraph/coingecko/tickers_1.json');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);
    const wellVolumeResponse = require('../mock-responses/subgraph/coingecko/tickers_2.json');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellVolumeResponse);

    const tickers = await getTickers({ blockNumber: 19000000 });
    // console.log(tickers);

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
    expect(tickers[0].depth2.buy).toEqual([135736.220357, 52.8335281459809]);
    expect(tickers[0].depth2.sell).toEqual([139870.493345, 54.44273921546687]);
    expect(tickers[0].high).toBeCloseTo(0.000392979136931714);
    expect(tickers[0].low).toBeCloseTo(0.000383640247389837);
  });

  it('should calculate token volume in the well (calculated directly from swaps only)', async () => {
    const wellsResponse = require('../mock-responses/subgraph/coingecko/swapVolume.json');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);

    const volume = await deprecated_calcWellSwapVolume(BEANWETH, 1715020584);
    expect(volume[BEAN].float).toBeCloseTo(71708.944062);
    expect(volume[WETH].float).toBeCloseTo(22.591723371417718);
  });

  it('should calculate high/low prices over the given period', async () => {
    const swapsResponse = require('../mock-responses/subgraph/coingecko/swaps.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(swapsResponse);
    const depositResponse = require('../mock-responses/subgraph/coingecko/deposits.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(depositResponse);
    const withdrawResponse = require('../mock-responses/subgraph/coingecko/withdrawals.json');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(withdrawResponse);

    const mockWellDto = {
      address: 'abc',
      tokenDecimals: () => [6, 18]
    };

    const priceRange = await getWellPriceRange(mockWellDto, 1715020584);

    expect(priceRange.high.float[0]).toEqual(0.000065);
    expect(priceRange.high.float[1]).toEqual(0.00000000000175889);
    expect(priceRange.low.float[0]).toEqual(210.587245);
    expect(priceRange.low.float[1]).toEqual(0.00000001717847889);
  });

  it('should return swap history', async () => {
    jest
      .spyOn(SubgraphClients, 'basinSG')
      .mockResolvedValueOnce(require('../mock-responses/subgraph/coingecko/wells.json'));
    jest
      .spyOn(SubgraphClients, 'basinSG')
      .mockResolvedValueOnce(require('../mock-responses/subgraph/coingecko/swapHistory.json'));

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
});
