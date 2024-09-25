const { BEANWSTETH, CP2 } = require('../../constants/addresses');
const ContractGetters = require('../../datasources/contracts/contract-getters');
const { BigInt_abs } = require('../bigint');
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

    const initialLp = BigInt(await wellFn.callStatic.calcLpTokenSupply(prevReserves, '0x'));
    const newLp = BigInt(await wellFn.callStatic.calcLpTokenSupply(newReserves, '0x'));
    const deltaLp = newLp - initialLp;

    // Determines how much of the liquidity operation was double sided.
    // Can then calculate how much was single sided.
    const doubleSided = (
      await wellFn.callStatic.calcLPTokenUnderlying(BigInt_abs(deltaLp), newReserves, newLp, '0x')
    ).map((bn) => {
      return deltaLp > 0n ? BigInt(bn) : -BigInt(bn);
    });
    const deltaReserves = [newReserves[0] - prevReserves[0], newReserves[1] - prevReserves[1]];
    return [doubleSided[0] - deltaReserves[0], doubleSided[1] - deltaReserves[1]];

    // const wellFn = await ContractGetters.getWellFunctionContract(CP2);
    //
    // const newRate0Out = BigInt(await wellFn.callStatic.calcRate(newReserves, 0, 1, '0x'));
    // const newRate0 = WellFnUtil.transformRate(newRate0Out, CP2, 1, decimals);

    // const ratio = [newRate0, BigInt(10 ** decimals[1])];
    // const reservesAfterTrade = (
    //   await Promise.all([
    //     wellFn.callStatic.calcReserveAtRatioSwap(prevReserves, 0, ratio, '0x'),
    //     wellFn.callStatic.calcReserveAtRatioSwap(prevReserves, 1, ratio, '0x')
    //   ])
    // ).map(BigInt);
    // return [prevReserves[0] - reservesAfterTrade[0], prevReserves[1] - reservesAfterTrade[1]];
  }
}

module.exports = WellUtil;
