jest.mock("../src/datasources/subgraph-client", () => ({
  ...jest.requireActual("../src/datasources/subgraph-client"),
  basinSG: jest.fn()
}));
const { basinSG } = require("../src/datasources/subgraph-client");

const { getTickers } = require("../src/service/coingecko-service");

describe('CoingeckoService', () => {

  it('should return all Basin tickers in the expected format', async () => {
    const wellsResponse = JSON.parse('{"wells":[{"id":"0xbea0e11282e2bb5893bece110cf199501e872bad","tokens":[{"id":"0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab","decimals":6},{"id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","decimals":18}],"reserves":["13834969782037","4519904117717436850412"]}]}');
    basinSG.mockResolvedValue(wellsResponse);

    const tickers = await getTickers();
    expect(tickers).toHaveLength(1);
    expect(tickers[0].ticker_id).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab_0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].base_currency).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab');
    expect(tickers[0].target_currency).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    expect(tickers[0].pool_id).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');

    // console.log(tickers);
  });
});
