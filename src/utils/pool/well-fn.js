const { BEANWSTETH } = require('../../constants/addresses');
const ContractGetters = require('../../datasources/contracts/contract-getters');

class WellFnUtil {
  // CP2
  // quoteToken + 18 / baseToken
  // so for bean:
  // 6 + 18 - 18 = 6
  // and eth:
  // 18 + 18 - 6 = 30
  // Stable2: always returns 6

  static async t(originalReserves) {
    const CP2 = '0xBA150C2ae0f8450D4B832beeFa3338d4b5982d26';
    const wellFn = await ContractGetters.getWellFunctionContract(CP2);
    const rate0 = await wellFn.callStatic.calcRate(originalReserves, 0, 1, '0x00');
    const rate1 = await wellFn.callStatic.calcRate(originalReserves, 1, 0, '0x00');
    console.log(BigInt(rate0), BigInt(rate1));

    const outReserves0 = await wellFn.callStatic.calcReserveAtRatioSwap(
      originalReserves,
      0,
      // [rate0, BigInt(10 ** 18)],
      [Math.floor(Number(rate0) * 0.98), BigInt(10 ** 18)],
      '0x00'
    );
    console.log(BigInt(outReserves0));

    const outReserves1 = await wellFn.callStatic.calcReserveAtRatioSwap(
      originalReserves,
      1,
      // [rate0, BigInt(10 ** 18)],
      [Math.floor(Number(rate0) * 0.98), BigInt(10 ** 18)],
      '0x00'
    );
    return [BigInt(outReserves0), BigInt(outReserves1)];
  }
}

module.exports = WellFnUtil;
