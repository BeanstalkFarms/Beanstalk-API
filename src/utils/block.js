const { providerThenable } = require("../datasources/alchemy");
const { gql } = require("../datasources/subgraph-client");

class BlockUtil {
  // Returns the block data to use for the given options.
  // Valid options are blockNumber and timestamp.
  static async blockFromOptions(options) {
    let blockTag = options.blockNumber ?? 'latest';
    if (options.timestamp) {
      return await findBlockByTimestamp(options.timestamp);
    } else {
      return await (await providerThenable).getBlock(blockTag);
    }
  }

  // Returns the block data to use for the given options,
  // constrained by the maximal indexed block of the given subgraph.
  static async blockForSubgraphFromOptions(subgraphClient, options) {
    const subgraphBlock = (await subgraphClient(gql`
      {
        _meta {
          block {
            number
          }
        }
      }`
    ))._meta.block.number;

    const optionsBlock = await this.blockFromOptions(options);
    const blockToUse = Math.min(subgraphBlock, optionsBlock.number);
    
    return await (await providerThenable).getBlock(blockToUse);
  }

  // Performs a binary search lookup to find the ethereum block number closest to this timestamp
  static async findBlockByTimestamp(timestamp) {
    const provider = await providerThenable;
    let upper = await provider.getBlockNumber();
    let lower = 12900000; // Beanstalk did not exist prior to this block
    let bestBlock = null;

    while (lower <= upper) {
      const mid = lower + Math.floor((upper - lower) / 2);
      bestBlock = await provider.getBlock(mid);

      if (bestBlock.timestamp == timestamp) {
        break;
      } if (bestBlock.timestamp < timestamp) {
        lower = mid + 1;
      } else {
        upper = mid - 1;
      }
    }
    return bestBlock;
  }
}

module.exports = BlockUtil;

