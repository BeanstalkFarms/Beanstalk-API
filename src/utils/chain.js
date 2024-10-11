const { Network } = require('alchemy-sdk');

class ChainUtil {
  static isValidChain(chain) {
    return Object.values(Network).includes(`${chain}-mainnet`);
  }
}

module.exports = ChainUtil;
