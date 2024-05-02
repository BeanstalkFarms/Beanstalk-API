const { providerThenable } = require("../datasources/alchemy");
const { asyncPriceV1ContractGetter } = require("../datasources/contracts");

async function getBeanPrice(options = {}) {
  const block = await blockFromOptions(options);
  const priceContract = await asyncPriceV1ContractGetter();
  const priceResult = await priceContract.callStatic.price({ blockTag: block.number });

  // Convert from hex to a readable format. For now the pool prices are omitted
  const readable = {
    block: block.number,
    timestamp: block.timestamp,
    price: parseFloat((priceResult.price.toNumber() / Math.pow(10, 6)).toFixed(4)),
    liquidityUSD: parseFloat((priceResult.liquidity.toNumber() / Math.pow(10, 6)).toFixed(2)),
    deltaB: parseFloat((priceResult.deltaB.toNumber() / Math.pow(10, 6)).toFixed(0))
  };
  return readable;
}

async function blockFromOptions(options) {
  let blockTag = options.blockNumber ?? 'latest';
  if (options.timestamp) {
    return await findBlockByTimestamp(options.timestamp);
  } else {
    return await (await providerThenable).getBlock(blockTag);
  }
}

// Performs a binary search lookup to find the ethereum block number closest to this timestamp
async function findBlockByTimestamp(timestamp) {
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

module.exports = {
  getBeanPrice
}
