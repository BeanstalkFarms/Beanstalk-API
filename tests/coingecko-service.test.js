const SubgraphClients = require("../src/datasources/subgraph-client");

const BlockUtil = require("../src/utils/block");
jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue({ number: 19000000, timestamp: 1705173443 });

const { getTickers, getWellVolume } = require("../src/service/coingecko-service");
const { BEANWETH } = require("../src/constants/addresses");

describe('CoingeckoService', () => {

  it('should return all Basin tickers in the expected format', async () => {
    const wellsResponse = JSON.parse('{"wells":[{"id":"0xbea0e11282e2bb5893bece110cf199501e872bad","tokens":[{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18}],"reserves":["13776890377201","5362472327552046319200"]}]}');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValue(wellsResponse);

    const tickers = await getTickers({ blockNumber: 19000000 });
    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker_id).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].base_currency).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab');
    expect(tickers[0].target_currency).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].pool_id).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(tickers[0].last_price).toEqual('0.000389236771196659');
    // expect(tickers[0].base_volume).toEqual('');
    // expect(tickers[0].target_volume).toEqual('');
    expect(tickers[0].liquidity_in_usd).toEqual('27491580');
    // expect(tickers[0].high).toEqual('');
    // expect(tickers[0].low).toEqual('');

    // console.log(tickers);
  });

  it('should calculate token volume in the well', async () => {
    const volume = await getWellVolume(BEANWETH, 1715020584);
  });
});
