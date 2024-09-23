const { formatUnits } = require('ethers');

class NumberUtil {
  // For the given BigInt/decimal precision, spread into BigInt, string, and float result.
  // values/decimals can either be a single value, or an array
  static createNumberSpread(values, decimals, floatPrecision = undefined) {
    if (!Array.isArray(values)) {
      return NumberUtil.#getSpread(values, decimals, floatPrecision);
    }

    const retval = {
      raw: [],
      string: [],
      float: []
    };
    for (let i = 0; i < values.length; ++i) {
      const { raw, string, float } = NumberUtil.#getSpread(values[i], decimals[i], floatPrecision?.[i]);
      retval.raw.push(raw);
      retval.string.push(string);
      retval.float.push(float);
    }
    return retval;
  }

  // Internal function for spreading an individual BigInt
  static #getSpread(value, decimals, floatPrecision) {
    let string = formatUnits(value.toString(), decimals);
    let float = parseFloat(formatUnits(value.toString(), decimals));
    if (floatPrecision != undefined) {
      string = float.toFixed(floatPrecision);
      float = parseFloat(string);
    }
    return {
      raw: value,
      string,
      float
    };
  }

  static allToBigInt(obj, ignoreList = []) {
    for (let key in obj) {
      if (ignoreList.includes(key)) {
        continue;
      }
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
          try {
            obj[key] = BigInt(obj[key]);
          } catch (e) {}
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          NumberUtil.allToBigInt(obj[key], ignoreList);
        }
      }
    }
    return obj;
  }

  /**
   * Convert the given value into a number with the desired decimal precision. For example, if converting
   * something with 18 decimals, it may be desired to keep some of that precision rather than truncating, but
   * still performing sufficient division
   * @param {BigInt} v - the value to convert
   * @param {number} precision - the precision of v
   * @param {number} resultPrecision - the desired number of decimal points in the result
   */
  static fromBigInt(v, precision, resultPrecision = precision) {
    if (resultPrecision < 0 || resultPrecision > precision) {
      throw new Error('Invalid result precision');
    }
    return Number(v / BigInt(10 ** (precision - resultPrecision))) / Math.pow(10, resultPrecision);
  }

  static toBigInt(v, precision) {
    return BigInt(v * 10 ** precision);
  }

  static sum(a) {
    return a.reduce((r, c) => r + c, 0);
  }
}

module.exports = NumberUtil;
