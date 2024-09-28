const { C, RuntimeConstants } = require('../src/constants/runtime-constants');

describe('Chain constants', () => {
  test('TEMP test', () => {
    // jest.spyOn(RuntimeConstants, 'underlying').mockReturnValue(4);
    console.log(C('arb').BEANSTALK);
    console.log(C('eth').provider);
    console.log(C('eth').DECIMALS);
  });
});
