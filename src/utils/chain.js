const { Network } = require('alchemy-sdk');

const BLOCK_FREQUENCY = {
  eth: 12000,
  arb: 250
};

class ChainUtil {
  static isValidChain(chain) {
    return Object.values(Network).includes(`${chain}-mainnet`);
  }

  static blocksPerInterval(chain, interval) {
    return Math.floor(interval / BLOCK_FREQUENCY[chain]);
  }
}

module.exports = ChainUtil;
