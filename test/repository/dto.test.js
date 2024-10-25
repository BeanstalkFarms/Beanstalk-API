const DepositDto = require('../../src/repository/dto/DepositDto');
const WellDto = require('../../src/repository/dto/WellDto');
const { allToBigInt } = require('../../src/utils/number');

const sampleWell = require('../mock-responses/subgraph/entities/well.json');
const sampleDeposit = require('../mock-responses/subgraph/entities/siloDeposit.json');

const whitelistTokenInfo = allToBigInt(require('../mock-responses/service/whitelistedTokenInfo.json'));

describe('DTO Objects', () => {
  test('Creates WellDto from subgraph data', async () => {
    const well = new WellDto(sampleWell);
    expect(well.address).toEqual('0xbea0e11282e2bb5893bece110cf199501e872bad');
    expect(well.reserves.raw).toEqual([12345678n, 18275892375891378924n]);
    expect(well.tokens[1].address).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  });
  describe('Deposit', () => {
    test('Creates DepositDto from subgraph data', async () => {
      const deposit = DepositDto.fromSubgraph(sampleDeposit);
      expect(deposit.account).toEqual('0x0000002e4f99cb1e699042699b91623b1334d2f7');
      expect(deposit.token).toEqual('0xbea0005b8599265d41256905a9b3073d397812e4');
      expect(deposit.stem).toEqual(-12474000000n);
      expect(deposit.depositedAmount).toEqual(167759n);
      expect(deposit.depositedBdv).toEqual(76747732n);
    });
    test('Sets computed values', () => {
      const deposit = DepositDto.fromSubgraph(sampleDeposit);
      deposit.mowStem = 0n;
      deposit.setStalkAndSeeds(whitelistTokenInfo[deposit.token]);
      deposit.updateLambdaStats(5000000n, whitelistTokenInfo[deposit.token]);

      expect(deposit.seedsOnLambda).not.toEqual(deposit.currentSeeds);
      expect(deposit.stalkOnLambda).not.toEqual(deposit.currentStalk);

      // Verify the magnitude of the computed values
      expect(deposit.baseStalk).toBeWithinRange(BigInt(10 ** 16), BigInt(10 ** 19));
      expect(deposit.grownStalk).toBeWithinRange(BigInt(10 ** 16), BigInt(10 ** 19));
      expect(deposit.currentStalk).toBeWithinRange(BigInt(10 ** 16), BigInt(10 ** 19));
      expect(deposit.mowableStalk).toBeWithinRange(BigInt(10 ** 16), BigInt(10 ** 19));
      expect(deposit.currentSeeds).toBeWithinRange(BigInt(10 ** 12), BigInt(10 ** 15));
      expect(deposit.bdvOnLambda).toBeWithinRange(BigInt(10 ** 6), BigInt(10 ** 9));
      expect(deposit.seedsOnLambda).toBeWithinRange(BigInt(10 ** 12), BigInt(10 ** 15));
      expect(deposit.stalkOnLambda).toBeWithinRange(BigInt(10 ** 16), 100n * BigInt(10 ** 19));
    });
  });
});
