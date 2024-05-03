const { formatUnits } = require("ethers");

// For the given BigNumber/decimal precision, spread into bn, string, and float result.
// bns/decimals can either be a single value, or an array
function createNumberSpread(bns, decimals, floatPrecision = undefined) {
  if (!Array.isArray(bns)) {
    return getSpread(bns, decimals, floatPrecision);
  }

  const retval = {
    bn: [],
    string: [],
    float: []
  };
  for (let i = 0; i < bns.length; ++i) {
    const { bn, string, float } = getSpread(bns[i], decimals[i], floatPrecision?.[i]);
    retval.bn.push(bn);
    retval.string.push(string);
    retval.float.push(float);
  }
  return retval;
}

// Internal function for spreading an individual BigNumber
function getSpread(bn, decimals, floatPrecision) {
  let string = formatUnits(bn.toString(), decimals);
  let float = parseFloat(formatUnits(bn.toString(), decimals));
  if (floatPrecision != undefined) {
    string = float.toFixed(floatPrecision);
    float = parseFloat(string);
  }
  return {
    bn,
    string,
    float
  }
}

module.exports = {
  createNumberSpread
}
