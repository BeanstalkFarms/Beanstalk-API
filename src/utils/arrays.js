const { isNil } = require('./bigint');

class ArraysUtil {
  static toChunks(array, size) {
    if (!size) {
      throw new Error('size must be > 0');
    }

    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}

module.exports = ArraysUtil;
