const { C, RuntimeConstants } = require('../src/constants/runtime-constants');
const AlchemyUtil = require('../src/datasources/alchemy');

describe('Chain constants', () => {
  test('TEMP test', () => {
    // jest.spyOn(RuntimeConstants, 'underlying').mockReturnValue(4);
    const alchemySpy = jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue(10);
    expect(C('eth').provider).toEqual(10);
    expect(alchemySpy).toHaveBeenCalledWith('eth');

    console.log(C('arb').BEANSTALK);
    console.log(C('eth').DECIMALS.bdv);
  });
});
