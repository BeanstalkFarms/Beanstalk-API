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
    return allWells
      .map((w) => new WellDto(w))
      .reduce((acc, next) => {
        acc[next.address] = next;
        return acc;
      }, {});
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

  static async getAllSwaps(fromTimestamp, toTimestamp) {
    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        swaps {
          well {
            id
          }
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allSwaps.forEach((s) => (s.tokenPrice = s.tokenPrice.map(BigInt)));
    return allSwaps;
  }

  static async getAllDeposits(fromTimestamp, toTimestamp) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        deposits {
          well {
            id
          }
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allDeposits.forEach((d) => (d.tokenPrice = d.tokenPrice.map(BigInt)));
    return allDeposits;
  }

  static async getAllWithdraws(fromTimestamp, toTimestamp) {
    const allWithdraws = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        withdraws {
          well {
            id
          }
          tokenPrice
          timestamp
          logIndex
        }
      }`,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allWithdraws.forEach((w) => (w.tokenPrice = w.tokenPrice.map(BigInt)));
    return allWithdraws;
  }
}

module.exports = BasinSubgraphRepository;
