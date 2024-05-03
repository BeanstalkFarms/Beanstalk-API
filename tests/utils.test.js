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
});
