const SubgraphClients = require("../src/datasources/subgraph-client");

const BlockUtil = require("../src/utils/block");
jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue({ number: 19000000, timestamp: 1705173443 });

const { getTickers, calcWellSwapVolume, getWellPriceRange, getTrades } = require("../src/service/coingecko-service");
const { BEANWETH, WETH, BEAN } = require("../src/constants/addresses");
const { BigNumber } = require("alchemy-sdk");
const SubgraphQueryUtil = require("../src/utils/subgraph-query");

describe('CoingeckoService', () => {

  it('should return all Basin tickers in the expected format', async () => {
    const wellsResponse = JSON.parse('{"wells":[{"id":"0xbea0e11282e2bb5893bece110cf199501e872bad","tokens":[{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18}],"reserves":["13776890377201","5362472327552046319200"]}]}');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);
    const swapsResponse = JSON.parse('{"swaps":[{"amountIn":"31550733364","amountOut":"12135361453186685996","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705087739"},{"amountIn":"2221211344","amountOut":"852281445355575130","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705092503"},{"amountIn":"819909419","amountOut":"319078792113307509","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705095059"},{"amountIn":"14881783000000000000","amountOut":"38136920283","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"decimals":6,"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},"timestamp":"1705098539"},{"amountIn":"9970000000000000000","amountOut":"25431883809","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"decimals":6,"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},"timestamp":"1705098995"},{"amountIn":"356372497087637724","amountOut":"906908354","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"decimals":6,"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},"timestamp":"1705102751"},{"amountIn":"125144976","amountOut":"49178915992265078","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705102811"},{"amountIn":"654517381","amountOut":"257194707714557195","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705104971"},{"amountIn":"701649551","amountOut":"275688185035951467","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705108955"},{"amountIn":"1630986350","amountOut":"640728991377665191","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705109171"},{"amountIn":"38136920283","amountOut":"14938684353974365046","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705112387"},{"amountIn":"409175618","amountOut":"159829846323998063","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705112663"},{"amountIn":"25431883809","amountOut":"9915431347242893965","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705116479"},{"amountIn":"231552660","amountOut":"90110089924784099","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705117655"},{"amountIn":"2722158958","amountOut":"1059117306704162070","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705134539"},{"amountIn":"616761625","amountOut":"239906893509136283","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705135043"},{"amountIn":"642325269","amountOut":"249965222820550482","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705150751"},{"amountIn":"4858299716","amountOut":"1889886110483877212","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705155431"},{"amountIn":"1107092821","amountOut":"430474553364305936","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1705158947"}]}');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(swapsResponse);

    const tickers = await getTickers({ blockNumber: 19000000 });
    // console.log(tickers);
    
    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker_id).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].base_currency).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab');
    expect(tickers[0].target_currency).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].pool_id).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(tickers[0].last_price).toBeCloseTo(0.000389236771196659);
    expect(tickers[0].base_volume).toBeCloseTo(176336.03559);
    expect(tickers[0].target_volume).toBeCloseTo(68.711073712211718446);
    expect(tickers[0].liquidity_in_usd).toEqual(27491580);
    expect(tickers[0].high).toBeCloseTo(0.000392979136931714);
    expect(tickers[0].low).toBeCloseTo(0.000383640247389837);

  });

  it('should calculate token volume in the well (calculated directly from swaps only)', async () => {
    const wellsResponse = JSON.parse('{"swaps":[{"amountIn":"5131964424","amountOut":"1627597256416504757","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714937735"},{"amountIn":"71520435","amountOut":"22668472364298959","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714973123"},{"amountIn":"18078262136","amountOut":"5722530055315977132","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714975211"},{"amountIn":"16792473647","amountOut":"5288380773207334379","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714976867"},{"amountIn":"14616377416","amountOut":"4592844421686613661","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714983803"},{"amountIn":"742442383","amountOut":"233041161817517121","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984139"},{"amountIn":"422877031","amountOut":"132723607168152499","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984211"},{"amountIn":"318301411","amountOut":"99896408349110369","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714984235"},{"amountIn":"500000000000000000","amountOut":"1593024080","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"decimals":6,"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},"timestamp":"1714999859"},{"amountIn":"10000000000","amountOut":"3136819142012486603","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1715000567"},{"amountIn":"3941701099","amountOut":"1235222073079723666","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1715013623"}]}');
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(wellsResponse);
    
    const volume = await calcWellSwapVolume(BEANWETH, 1715020584);
    expect(volume[BEAN].float).toBeCloseTo(71708.944062);
    expect(volume[WETH].float).toBeCloseTo(22.591723371417718);
  });

  it('should calculate high/low prices over the given period', async () => {
    const swapsResponse = JSON.parse('[{"amountIn":"5000000000","amountOut":"1500000000000000000","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714937735"},{"amountIn":"8000000000","amountOut":"2000000000000000000","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714973123"},{"amountIn":"500000000000000000","amountOut":"2000000000","toToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"fromToken":{"decimals":18,"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"},"timestamp":"1714975211"}]');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(swapsResponse);
    const depositResponse = JSON.parse('[{"reserves":["2000000000","0"],"timestamp":"1715937735"},{"reserves":["0","1500000000000000000"],"timestamp":"1712938735"}]');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(depositResponse);
    const withdrawResponse = JSON.parse('[{"reserves":["7000000000","0"],"timestamp":"1714938735"},{"reserves":["0","5500000000000000000"],"timestamp":"1725937735"}]');
    jest.spyOn(SubgraphQueryUtil, 'allPaginatedSG').mockResolvedValueOnce(withdrawResponse);

    const tokens = [
      {
        id: BEAN.toLowerCase(),
        decimals: 6
      },
      {
        id: WETH.toLowerCase(),
        decimals: 18
      }
    ];
    const priceRange = await getWellPriceRange(BEANWETH, tokens, [BigNumber.from("20000000000"), BigNumber.from("10000000000000000000")], 1715020584);
    expect(priceRange.high.float[0]).toBeCloseTo(0.00075);
    expect(priceRange.low.float[0]).toBeCloseTo(0.001416666666666666);
  });

  it('should return swap history', async () => {
    
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(JSON.parse('{"wells":[{"id":"0xbea0e11282e2bb5893bece110cf199501e872bad","tokens":[{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab"},{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}]}]}'));
    jest.spyOn(SubgraphClients, 'basinSG').mockResolvedValueOnce(JSON.parse('{"swaps":[{"amountIn":"5000000000","amountOut":"1627986324056845061","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714705907","blockNumber":"19786824","logIndex":334},{"amountIn":"17587084351","amountOut":"5735653111300472776","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714701743","blockNumber":"19786480","logIndex":358},{"amountIn":"3351405114","amountOut":"1094643603804553368","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714701515","blockNumber":"19786461","logIndex":194},{"amountIn":"10000000000","amountOut":"3269377213099025460","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714687691","blockNumber":"19785315","logIndex":417},{"amountIn":"95676849","amountOut":"31303213763521321","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714685627","blockNumber":"19785144","logIndex":166},{"amountIn":"1026995528","amountOut":"336002541531334128","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714669619","blockNumber":"19783823","logIndex":348},{"amountIn":"947804302","amountOut":"310137813044956371","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714656515","blockNumber":"19782738","logIndex":377},{"amountIn":"1856781829","amountOut":"607694116854445958","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714647803","blockNumber":"19782016","logIndex":119},{"amountIn":"462377515790747244","amountOut":"1412728161","fromToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"toToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"timestamp":"1714613735","blockNumber":"19779197","logIndex":270},{"amountIn":"1419390950","amountOut":"464558430713920015","fromToken":{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},"toToken":{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18},"timestamp":"1714611683","blockNumber":"19779029","logIndex":255}]}'));

    const options = {
      ticker_id: `${BEAN}_${WETH}`,
      // These technically arent necessary due to the above mocking
      limit: 10,
      start_time: 1714114912,
      end_time: 1714719712
    };
    const trades = await getTrades(options);
    // console.log(trades);

    expect(trades.buy.length).toEqual(1);
    expect(trades.sell.length).toEqual(9);
    expect(trades.buy[0].price).toBeCloseTo(3055.356527);
    expect(trades.buy[0].base_volume).toBeCloseTo(0.46237751579074726);
    expect(trades.buy[0].target_volume).toBeCloseTo(1412.728161);
    expect(trades.buy[0].trade_timestamp).toEqual(1714613735000);
    expect(trades.buy[0].type).toEqual('buy');

  });
});
