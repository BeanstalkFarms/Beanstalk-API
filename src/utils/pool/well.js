const { BEANWSTETH, CP2 } = require('../../constants/addresses');
const ContractGetters = require('../../datasources/contracts/contract-getters');
const { fromBigInt } = require('../number');
const WellFnUtil = require('./well-fn');

class WellUtil {
  // Calculates the token volume resulting from a liquidity add operation.
  // This functionality may or may not be helpful within this API project - it is used in subgraphs.
  // However it was first developed here as a means of understanding the inputs/outputs.
  static async calcLiquidityVolume(prevReserves, newReserves, decimals) {
    // INCORRECT
    // const well = await ContractGetters.getWellContract(BEANWSTETH);
    // const lpGained = BigInt(await well.callStatic.getAddLiquidityOut([BigInt(500 * 10 ** 6), 0n]));
    // console.log('lp gained', lpGained);
    // const tokensRemovable = (await well.callStatic.getRemoveLiquidityOut(lpGained)).map(BigInt);
    // console.log('tokensRemovable', fromBigInt(tokensRemovable[0], 6, 2), fromBigInt(tokensRemovable[1], 18, 4));

    const wellFn = await ContractGetters.getWellFunctionContract(CP2);

    const newRate0Out = BigInt(await wellFn.callStatic.calcRate(newReserves, 0, 1, '0x'));
    const newRate0 = WellFnUtil.transformRate(newRate0Out, CP2, 1, decimals);

    const ratio = [newRate0, BigInt(10 ** decimals[1])];
    const reservesAfterTrade = (
      await Promise.all([
        wellFn.callStatic.calcReserveAtRatioSwap(prevReserves, 0, ratio, '0x'),
        wellFn.callStatic.calcReserveAtRatioSwap(prevReserves, 1, ratio, '0x')
      ])
    ).map(BigInt);
    return [prevReserves[0] - reservesAfterTrade[0], prevReserves[1] - reservesAfterTrade[1]];
  }
}

module.exports = WellUtil;