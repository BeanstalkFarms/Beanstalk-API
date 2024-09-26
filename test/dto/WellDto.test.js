const WellDto = require('../../src/repository/subgraph/dto/WellDto');

describe('WellDto', () => {
  test('Creates WellDto from subgraph data', async () => {
    const sampleWell = require('../mock-responses/subgraph/entities/well.json');
    const well = new WellDto(sampleWell);
    expect(well.address).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(well.reserves.raw).toEqual([12345678n, 18275892375891378924n]);
    expect(well.tokens[1].address).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  });
});
