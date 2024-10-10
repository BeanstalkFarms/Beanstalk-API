const { gql } = require('graphql-request');
const { C } = require('../../constants/runtime-constants');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const WellDto = require('./dto/WellDto');

class BasinSubgraphRepository {
  static async getAllWells(blockNumber, c = C()) {
    const allWells = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
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

  static async getWellSwapsForPair(tokens, fromTimestamp, toTimestamp, limit, c = C()) {
    const wellSwaps = await c.SG.BASIN(gql`
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

  static async getAllSwaps(fromTimestamp, toTimestamp, c = C()) {
    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          swaps {
            well {
              id
            }
            tokenPrice
            timestamp
            logIndex
          }
        }
      `,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allSwaps.forEach((s) => (s.tokenPrice = s.tokenPrice.map(BigInt)));
    return allSwaps;
  }

  static async getAllDeposits(fromTimestamp, toTimestamp, c = C()) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          deposits {
            well {
              id
            }
            tokenPrice
            timestamp
            logIndex
          }
        }
      `,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      ['timestamp', 'logIndex'],
      [fromTimestamp.toFixed(0), 0],
      'asc'
    );
    allDeposits.forEach((d) => (d.tokenPrice = d.tokenPrice.map(BigInt)));
    return allDeposits;
  }

  static async getAllWithdraws(fromTimestamp, toTimestamp, c = C()) {
    const allWithdraws = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          withdraws {
            well {
              id
            }
            tokenPrice
            timestamp
            logIndex
          }
        }
      `,
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
