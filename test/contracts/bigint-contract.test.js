const SuperContract = require('../../src/datasources/contracts/super-contract');

describe('SuperContract', () => {
  test('converts singleton values', () => {
    expect(SuperContract._transformAll('50')).toEqual(50n);
    expect(SuperContract._transformAll(5)).toEqual(5n);
    expect(SuperContract._transformAll('seventy')).toEqual('seventy');
  });
  test('converts array entries', () => {
    expect(SuperContract._transformAll(['50', 5, 'test'])).toEqual([50n, 5n, 'test']);
  });
  test('named tuple preserves naming', () => {
    const tuple = [50, 'string', '78'];
    tuple.prop1 = 50;
    tuple.prop2 = 'string';
    tuple.prop3 = '78';

    expect(SuperContract._transformAll(tuple)).toEqual({
      prop1: 50n,
      prop2: 'string',
      prop3: 78n
    });
  });
});
