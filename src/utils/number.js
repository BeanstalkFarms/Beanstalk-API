const { BigNumber } = require('alchemy-sdk');
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

  // Converts `obj` and any subproperties into BigInt. Handles the various types of BigNumber.
  static allToBigInt(obj, ignoreList = []) {
    if (obj) {
      if (obj.type === 'BigNumber') {
        return BigInt(BigNumber.from(obj.hex));
      } else if (BigNumber.isBigNumber(obj)) {
        return BigInt(obj);
      } else if (typeof obj === 'string' || typeof obj === 'number') {
        try {
          return BigInt(obj);
        } catch (e) {
          return obj;
        }
      }
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; ++i) {
        obj[i] = NumberUtil.allToBigInt(obj[i], ignoreList);
      }
    } else {
      for (let key in obj) {
        if (ignoreList.includes(key)) {
          continue;
        }
        if (obj.hasOwnProperty(key)) {
          obj[key] = NumberUtil.allToBigInt(obj[key], ignoreList);
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

  static percentDiff(base, current) {
    if (base === current) {
      return 0;
    }
    const diff = base > current ? base - current : current - base;
    return Number(diff) / Number(base);
  }
}

module.exports = NumberUtil;
