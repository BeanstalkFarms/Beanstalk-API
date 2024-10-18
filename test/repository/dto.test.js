const DepositDto = require('../../src/repository/subgraph/dto/DepositDto');
const WellDto = require('../../src/repository/subgraph/dto/WellDto');

describe('DTO Objects', () => {
  test('Creates WellDto from subgraph data', async () => {
    const sampleWell = require('../mock-responses/subgraph/entities/well.json');
    const well = new WellDto(sampleWell);
    expect(well.address).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(well.reserves.raw).toEqual([12345678n, 18275892375891378924n]);
    expect(well.tokens[1].address).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  });
  describe('Deposit', () => {
    test('Creates DepositDto from subgraph data', async () => {
      const sampleDeposit = require('../mock-responses/subgraph/entities/siloDeposit.json');
      const deposit = DepositDto.fromSubgraph(sampleDeposit);
      expect(deposit.account).toEqual('0x0000002e4f99cb1e699042699b91623b1334d2f7');
      expect(deposit.token).toEqual('0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab');
      expect(deposit.stem).toEqual(-12474000000n);
      expect(deposit.depositedAmount).toEqual(167759n);
      expect(deposit.depositedBdv).toEqual(76747732n);
    });
    // TODO: test setter functions
  });
});
