const SubgraphQueryUtil = require('../../utils/subgraph-query');
const { allToBigInt } = require('../../utils/number');
const { C } = require('../../constants/runtime-constants');
const { gql } = require('graphql-request');
const DepositDto = require('../dto/DepositDto');

class BeanstalkSubgraphRepository {
  static async getDepositedBdvs(accounts, blockNumber, c = C()) {
    const silos = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BEANSTALK,
      gql`
        {
          silos {
            id
            stalk
            assets {
              token
              depositedBDV
            }
          }
        }
      `,
      `block: {number: ${blockNumber}}`,
      `id_in: [${accounts.map((a) => `"${a}"`).join(', ')}]`,
      {
        field: 'stalk',
        lastValue: 0,
        direction: 'asc'
      }
    );
    const retval = {};
    for (const silo of silos) {
      const assets = {};
      for (const asset of silo.assets) {
        assets[asset.token] = asset.depositedBDV;
      }
      retval[silo.id] = assets;
    }
    return retval;
  }

  // From/to inclusive
  static async getSiloHourlyRewardMints(fromSeason, toSeason, c = C()) {
    const siloHourlySnapshots = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BEANSTALK,
      gql`
        {
          siloHourlySnapshots {
            id
            season
            deltaBeanMints
          }
        }
      `,
      '',
      `silo: "${c.BEANSTALK}", season_lte: ${toSeason}`,
      {
        field: 'season',
        // Lower bound season is applied here (gte)
        lastValue: fromSeason,
        direction: 'asc'
      }
    );
    return allToBigInt(
      siloHourlySnapshots.reduce((result, next) => {
        result[next.season] = next.deltaBeanMints;
        return result;
      }, {})
    );
  }

  static async getPreGaugeApyInputs(season, c = C()) {
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(season, c);

    const apyInputs = await c.SG.BEANSTALK(gql`
      {
        whitelistTokenSettings(
          block: {number: ${blockNumber}}
        ) {
          id
          stalkEarnedPerSeason
          stalkIssuedPerBdv
        }
        silo(
          id: "${c.BEANSTALK}",
          block: {number: ${blockNumber}}
        ) {
          stalk
          grownStalkPerSeason
          depositedBDV
        }
      }`);
    const tokens = apyInputs.whitelistTokenSettings.reduce((result, nextToken) => {
      result[nextToken.id] = {
        baseStalk: nextToken.stalkIssuedPerBdv,
        grownStalkPerSeason: nextToken.stalkEarnedPerSeason
      };
      return result;
    }, {});
    return allToBigInt({
      silo: apyInputs.silo,
      tokens
    });
  }

  static async getGaugeApyInputs(season, c = C()) {
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(season, c);

    const apyInputs = await c.SG.BEANSTALK(gql`
      {
        whitelistTokenSettings(
          block: {number: ${blockNumber}}
        ) {
          id
          stalkEarnedPerSeason
          stalkIssuedPerBdv
          isGaugeEnabled
          gaugePoints
          optimalPercentDepositedBdv
        }
        silo(
          id: "${c.BEANSTALK}",
          block: {number: ${blockNumber}}
        ) {
          beanToMaxLpGpPerBdvRatio
          stalk
          whitelistedTokens
        }
        siloAssets(
          where: {silo: "${c.BEANSTALK}", depositedBDV_gt: "0"}
          block: {number: ${blockNumber}}
        ) {
          token
          depositedBDV
        }
        germinatings(
          where: {isFarmer: false}
          block: {number: ${blockNumber}}
        ) {
          address
          type
          bdv
        }
      }`);

    const depositAmounts = apyInputs.siloAssets.reduce((result, nextAsset) => {
      const { token, ...rest } = nextAsset;
      result[token] = {
        ...rest
      };
      return result;
    }, {});

    const germinationInfo = {};
    for (const token in depositAmounts) {
      germinationInfo[token] = [
        apyInputs.germinatings.find((g) => g.address === token && g.type === 'EVEN')?.bdv ?? '0',
        apyInputs.germinatings.find((g) => g.address === token && g.type === 'ODD')?.bdv ?? '0'
      ];
    }

    const tokens = apyInputs.whitelistTokenSettings.reduce((result, nextToken) => {
      const { id, ...rest } = nextToken;
      result[id] = {
        depositedBDV: depositAmounts[id]?.depositedBDV ?? 0n,
        germinatingBDV: germinationInfo?.[id] ?? [0n, 0n],
        isWhitelisted: apyInputs.silo.whitelistedTokens.includes(id),
        ...rest
      };
      return result;
    }, {});

    return allToBigInt(
      {
        silo: apyInputs.silo,
        tokens
      },
      ['whitelistedTokens']
    );
  }

  static async getBlockForSeason(season, c = C()) {
    const result = await c.SG.BEANSTALK(gql`
      {
        seasons(where: {season: ${season}}) {
          sunriseBlock
        }
      }`);
    return result.seasons[0]?.sunriseBlock;
  }

  static async getLatestSeason(c = C()) {
    const result = await c.SG.BEANSTALK(gql`
      {
        seasons(orderBy: season, orderDirection: desc, first: 1) {
          season
          sunriseBlock
          createdAt
        }
      }
    `);
    return result.seasons[0];
  }

  // Returns all tokens that have been whitelisted prior to the given block or season.
  static async getPreviouslyWhitelistedTokens({ block, season }, c = C()) {
    const blockNumber = block ?? (await BeanstalkSubgraphRepository.getBlockForSeason(season, c));
    const result = await c.SG.BEANSTALK(gql`
      {
        silo(
          id: "${c.BEANSTALK}"
          block: {number: ${blockNumber}}
        ) {
          whitelistedTokens
          dewhitelistedTokens
        }
      }`);
    return {
      whitelisted: result.silo.whitelistedTokens,
      all: [...result.silo.whitelistedTokens, ...result.silo.dewhitelistedTokens]
    };
  }

  static async getAllDeposits(blockNumber, c = C()) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BEANSTALK,
      gql`
        {
          siloDeposits {
            ${DepositDto.subgraphFields}
            id
            createdBlock
          }
        }
      `,
      `block: {number: ${blockNumber}}`,
      '',
      {
        field: 'createdBlock',
        lastValue: 0,
        direction: 'asc'
      }
    );
    return allDeposits.map((d) => DepositDto.fromSubgraph(d));
  }
}

module.exports = BeanstalkSubgraphRepository;
