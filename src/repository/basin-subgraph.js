const { BigNumber } = require("alchemy-sdk");
const SubgraphClients = require("../datasources/subgraph-client");
const SubgraphQueryUtil = require("../utils/subgraph-query");

class BasinSubgraphRepository {

  static async getAllWells(blockNumber) {

    const allWells = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        wells {
          id
          tokens {
            id
            decimals
          }
          reserves
        }
      }`,
      `block: {number: ${blockNumber}}`,
      '',
      ['symbol'],
      ['a'],
      'asc'
    );
    allWells.map(well => well.reserves = well.reserves.map(BigNumber.from));
    return allWells;
  }

  static async getAllSwaps(wellAddress, fromTimestamp, toTimestamp) {

    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        swaps {
          amountIn
          amountOut
          fromToken {
            id
            decimals
          }
          toToken {
            decimals
            id
          }
          timestamp
        }
      }`,
      null,
      `well: "${wellAddress}", timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allSwaps.map((swap) => {
      swap.amountIn = BigNumber.from(swap.amountIn);
      swap.amountOut = BigNumber.from(swap.amountOut);
    });

    return allSwaps;
  }
}

module.exports = BasinSubgraphRepository;
