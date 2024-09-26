const SubgraphClients = require('../../datasources/subgraph-client');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const WellDto = require('./dto/WellDto');

class BasinSubgraphRepository {
  static async getAllWells(blockNumber) {
    const allWells = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        wells {
          ${WellDto.subgraphFields}
        }
      }`,
      `block: {number: ${blockNumber}}`,
      '',
      ['symbol'],
      [' '],
      'asc'
    );
    return allWells.map((w) => new WellDto(w));
  }

  static async getWellSwapsForPair(tokens, fromTimestamp, toTimestamp, limit) {
    const wellSwaps = await SubgraphClients.basinSG(SubgraphClients.gql`
      {
        wells(where: { tokens: [${tokens.map((t) => `"${t}"`).join(', ')}] }) {
          swaps(
            where: {
              timestamp_gte: ${fromTimestamp}
              timestamp_lte: ${toTimestamp}
            }
            first: ${limit}
            orderBy: timestamp
            orderDirection: desc
          ) {
            amountIn
            amountOut
            fromToken {
              id
              decimals
            }
            toToken {
              id
              decimals
            }
            timestamp
            blockNumber
            logIndex
          }
        }
      }`);

    const flattenedSwaps = wellSwaps.wells.reduce((acc, next) => {
      acc.push(...next.swaps);
      return acc;
    }, []);

    flattenedSwaps.forEach((swap) => {
      swap.amountIn = BigInt(swap.amountIn);
      swap.amountOut = BigInt(swap.amountOut);
    });
    return flattenedSwaps;
  }

  static async getAllSwaps(wellAddress, fromTimestamp, toTimestamp) {
    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        swaps {
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `well: "${wellAddress}", timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    return allSwaps.map((s) => (s.tokenPrice = s.tokenPrice.map(BigInt)));
  }

  static async getAllDeposits(wellAddress, fromTimestamp, toTimestamp) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        deposits {
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `well: "${wellAddress}", timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    return allDeposits.map((d) => (d.tokenPrice = d.tokenPrice.map(BigInt)));
  }

  static async getAllWithdraws(wellAddress, fromTimestamp, toTimestamp) {
    const allWithdraws = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        withdraws {
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `well: "${wellAddress}", timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    return allWithdraws.map((w) => (w.tokenPrice = w.tokenPrice.map(BigInt)));
  }
}

module.exports = BasinSubgraphRepository;
