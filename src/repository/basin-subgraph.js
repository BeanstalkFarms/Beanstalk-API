const { BigNumber } = require('alchemy-sdk');
const SubgraphClients = require('../datasources/subgraph-client');
const SubgraphQueryUtil = require('../utils/subgraph-query');

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
          symbol
        }
      }`,
      `block: {number: ${blockNumber}}`,
      '',
      ['symbol'],
      [' '],
      'asc'
    );
    allWells.map((well) => (well.reserves = well.reserves.map(BigNumber.from)));
    return allWells;
  }

  static async getWellsForPair(tokens) {
    const pairWells = await SubgraphClients.basinSG(SubgraphClients.gql`
      {
        wells(where: { tokens: [${tokens.map((t) => `"${t}"`).join(', ')}] }) {
          id
          tokens {
            id
          }
        }
      }`);
    return pairWells.wells;
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
          logIndex
        }
      }`,
      '',
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

  static async getSwaps(wellAddresses, fromTimestamp, toTimestamp, limit) {
    const result = await SubgraphClients.basinSG(SubgraphClients.gql`
      {
        swaps(
          where: {
            well_in: [${wellAddresses.map((a) => `"${a}"`).join(', ')}]
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
      }`);
    result.swaps.map((swap) => {
      swap.amountIn = BigNumber.from(swap.amountIn);
      swap.amountOut = BigNumber.from(swap.amountOut);
    });

    return result.swaps;
  }

  static async getAllDeposits(wellAddress, fromTimestamp, toTimestamp) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        deposits {
          reserves
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
    allDeposits.map((deposit) => (deposit.reserves = deposit.reserves.map(BigNumber.from)));

    return allDeposits;
  }

  static async getAllWithdraws(wellAddress, fromTimestamp, toTimestamp) {
    const allWithdraws = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      SubgraphClients.gql`
      {
        withdraws {
          reserves
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
    allWithdraws.map((withdraw) => (withdraw.reserves = withdraw.reserves.map(BigNumber.from)));

    return allWithdraws;
  }

  static async getRollingVolume(wellAddress, blockNumber) {
    const result = await SubgraphClients.basinSG(SubgraphClients.gql`
      {
        wells(
          block: {number: ${blockNumber}}
          where: {id: "${wellAddress}"}
        ) {
          tokens {
            decimals
          }
          rollingDailyBiTradeVolumeReserves
        }
      }`);
    return result.wells[0].tokens.map((t, idx) => ({
      bn: BigNumber.from(result.wells[0].rollingDailyBiTradeVolumeReserves[idx]),
      decimals: t.decimals
    }));
  }
}

module.exports = BasinSubgraphRepository;
