const SubgraphClients = require("../src/datasources/subgraph-client");

const BlockUtil = require("../src/utils/block");
jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue({ number: 19000000, timestamp: 1705173443 });

const { getTickers, getWellVolume } = require("../src/service/coingecko-service");
const { BEANWETH, WETH } = require("../src/constants/addresses");

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
    const wellsResponse = JSON.parse('{"swaps":[{"amountIn":"5131964424","amountOut":"1627597256416504757","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714937735"},{"amountIn":"71520435","amountOut":"22668472364298959","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714973123"},{"amountIn":"18078262136","amountOut":"5722530055315977132","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714975211"},{"amountIn":"16792473647","amountOut":"5288380773207334379","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714976867"},{"amountIn":"14616377416","amountOut":"4592844421686613661","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714983803"},{"amountIn":"742442383","amountOut":"233041161817517121","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984139"},{"amountIn":"422877031","amountOut":"132723607168152499","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984211"},{"amountIn":"318301411","amountOut":"99896408349110369","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984235"},{"amountIn":"500000000000000000","amountOut":"1593024080","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"decimals":6,"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},"timestamp":"1714999859"},{"amountIn":"10000000000","amountOut":"3136819142012486603","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1715000567"},{"amountIn":"3941701099","amountOut":"1235222073079723666","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1715013623"}]}');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValue(wellsResponse);
    const volume = await getWellVolume(BEANWETH, 1715020584);
    expect(volume[WETH].float).toBeCloseTo(22.591723371417718);
  });
});
