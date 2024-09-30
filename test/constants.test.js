const { C, RuntimeConstants } = require('../src/constants/runtime-constants');
const AlchemyUtil = require('../src/datasources/alchemy');
const AsyncContext = require('../src/utils/context');
const EnvUtil = require('../src/utils/env');

describe('Chain constants', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  test('Can access basic runtime constants through C object', () => {
    expect(C('eth').DECIMALS.stalk).toEqual(10);
    expect(C('arb').DECIMALS.stalk).toEqual(16);

    jest.spyOn(RuntimeConstants, 'underlying').mockReturnValue({ test: 4 });
    expect(C('eth').test).toEqual(4);
  });

  test('Can access provider through C object', () => {
    const alchemySpy = jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue(10);
    expect(C('eth').RPC).toEqual(10);
    expect(alchemySpy).toHaveBeenCalledWith('eth');
  });

  test('Uses default/contextual chain for C object', () => {
    jest.spyOn(EnvUtil, 'defaultChain').mockReturnValue('eth');
    expect(C().DECIMALS.stalk).toEqual(10);
    jest.spyOn(AsyncContext, 'get').mockReturnValue('arb');
    expect(C().DECIMALS.stalk).toEqual(16);
    jest.spyOn(AsyncContext, 'get').mockReturnValue('invalid chain');
    expect(() => C().DECIMALS.stalk).toThrow();
  });
});
