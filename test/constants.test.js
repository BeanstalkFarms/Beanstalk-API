const { C, RuntimeConstants } = require('../src/constants/runtime-constants');
const AlchemyUtil = require('../src/datasources/alchemy');
const AsyncContext = require('../src/utils/context');

describe('Chain constants', () => {
  test('Can access runtime constants through C object', () => {
    expect(C('eth').DECIMALS.stalk).toEqual(10);
    // expect(C('arb').DECIMALS.stalk).toEqual(16); // TODO

    const alchemySpy = jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue(10);
    expect(C('eth').provider).toEqual(10);
    expect(alchemySpy).toHaveBeenCalledWith('eth');

    // TODO: rework this test once default .env util is setup
    // expect(() => C()).toThrow();
    // jest.spyOn(AsyncContext, 'get').mockReturnValue('eth');
    // expect(() => C()).not.toThrow();

    jest.spyOn(RuntimeConstants, 'underlying').mockReturnValue({ test: 4 });
    expect(C('eth').test).toEqual(4);
  });
});
