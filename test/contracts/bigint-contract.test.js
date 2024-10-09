const BigIntContract = require('../../src/datasources/contracts/bigint-contract');

describe('UpgradeableContract', () => {
  test('converts singleton values', () => {
    expect(BigIntContract._transformAll('50')).toEqual(50n);
    expect(BigIntContract._transformAll(5)).toEqual(5n);
    expect(BigIntContract._transformAll('seventy')).toEqual('seventy');
  });
  test('converts array entries', () => {
    expect(BigIntContract._transformAll(['50', 5, 'test'])).toEqual([50n, 5n, 'test']);
  });
  test('named tuple preserves naming', () => {
    expect(
      BigIntContract._transformAll({
        prop1: 50,
        prop2: 'string',
        prop3: '78'
      })
    ).toEqual({
      prop1: 50n,
      prop2: 'string',
      prop3: 78n
    });
  });
});
