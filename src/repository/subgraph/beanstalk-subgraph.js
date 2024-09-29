const SubgraphClients = require('../../datasources/subgraph-client');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const { allToBigInt } = require('../../utils/number');
const { C } = require('../../constants/runtime-constants');

class BeanstalkSubgraphRepository {
  static async getDepositedBdvs(accounts, blockNumber) {
    const silos = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.beanstalkSG,
      SubgraphClients.gql`
      {
        silos {
          id
          stalk
          assets {
            token
            depositedBDV
          }
        }
      }`,
      `block: {number: ${blockNumber}}`,
      `id_in: [${accounts.map((a) => `"${a}"`).join(', ')}]`,
      ['stalk'],
      [0],
      'asc'
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

  static async getSiloHourlyRewardMints(fromSeason, toSeason) {
    const siloHourlySnapshots = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.beanstalkSG,
      SubgraphClients.gql`
      {
        siloHourlySnapshots {
          season
          deltaBeanMints
        }
      }`,
      '',
      `silo: "${C().BEANSTALK}", season_lte: ${toSeason}`,
      // Lower bound season is applied here
      ['season'],
      [fromSeason],
      'asc'
    );
    return allToBigInt(
      siloHourlySnapshots.reduce((result, next) => {
        result[next.season] = next.deltaBeanMints;
        return result;
      }, {})
    );
  }

  static async getPreGaugeApyInputs(beanstalk, season) {
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(season);

    const apyInputs = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        whitelistTokenSettings(
          block: {number: ${blockNumber}}
        ) {
          id
          stalkEarnedPerSeason
          stalkIssuedPerBdv
        }
        silo(
          id: "${beanstalk}",
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

  static async getGaugeApyInputs(beanstalk, season) {
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(season);

    const apyInputs = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
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
          id: "${beanstalk}",
          block: {number: ${blockNumber}}
        ) {
          beanToMaxLpGpPerBdvRatio
          stalk
          whitelistedTokens
        }
        siloAssets(
          where: {silo: "${beanstalk}", depositedBDV_gt: "0"}
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
        depositedBDV: depositAmounts[id].depositedBDV,
        germinatingBDV: germinationInfo[id],
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

  static async getBlockForSeason(season) {
    const result = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        seasons(where: {season: ${season}}) {
          sunriseBlock
        }
      }`);
    return result.seasons[0]?.sunriseBlock;
  }

  static async getLatestSeason() {
    const result = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        seasons(
          orderBy: season
          orderDirection: desc
          first: 1
        ) {
          season
          sunriseBlock
          createdAt
        }
      }`);
    return result.seasons[0];
  }

  // Returns all tokens that have been whitelisted prior to the given block or season.
  static async getPreviouslyWhitelistedTokens({ block, season }) {
    const blockNumber = block ?? (await this.getBlockForSeason(season));
    const result = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        silo(
          id: "${C().BEANSTALK}"
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
}

module.exports = BeanstalkSubgraphRepository;
