const { BigNumber } = require('alchemy-sdk');
const SubgraphClients = require('../datasources/subgraph-client');
const SubgraphQueryUtil = require('../utils/subgraph-query');
const { allToBigInt } = require('../utils/number');

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

  static async getSiloHourlyRewardMints(beanstalk, fromSeason, toSeason) {
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
      `silo: "${beanstalk}", season_lte: ${toSeason}`,
      // Lower bound seson is applied here
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
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(beanstalk, season);

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
          seeds
          stalk
          plantableStalk
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
    const blockNumber = await BeanstalkSubgraphRepository.getBlockForSeason(beanstalk, season);

    const apyInputs = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        whitelistTokenSettings(
          block: {number: ${blockNumber}}
        ) {
          id
          stalkEarnedPerSeason
          stalkIssuedPerBdv
          gpSelector
          gaugePoints
          optimalPercentDepositedBdv
        }
        silo(
          id: "${beanstalk}",
          block: {number: ${blockNumber}}
        ) {
          beanToMaxLpGpPerBdvRatio
          seeds
          stalk
          plantableStalk
          whitelistedTokens
        }
        siloAssets(
          where: {silo: "${beanstalk}", depositedBDV_gt: "0"}
          block: {number: ${blockNumber}}
        ) {
          token
          depositedBDV
        }
      }`);

    const depositAmounts = apyInputs.siloAssets.reduce((result, nextAsset) => {
      const { token, ...rest } = nextAsset;
      result[token] = {
        ...rest
      };
      return result;
    }, {});

    // Germination info must be retrieved in a separate call now that the tokens are known.
    // Ids are of the form token-(EVEN|ODD)
    // TODO: consider refactoring after the new subgraph is available; query by !isFarmer
    const germinationIds = Object.keys(depositAmounts).flatMap((t) => [`${t}-ODD`, `${t}-EVEN`]);
    const germinationResult = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        germinatings(
          where: {id_in: [${germinationIds.map((id) => `"${id}"`).join(', ')}]}
          block: {number: ${blockNumber}}
        ) {
          id
          bdv
        }
      }
    `);
    const germinationInfo = germinationIds.reduce((result, next) => {
      const elem = next.split('-');
      const savedGermination = germinationResult.germinatings.find((g) => g.id === next);
      if (!result[elem[0]]) {
        result[elem[0]] = [];
      }
      result[elem[0]][elem[1] === 'EVEN' ? 0 : 1] = savedGermination?.bdv ?? '0';
      return result;
    }, {});
    // console.log(germinationIds, germinationResult, germinationInfo);

    const tokens = apyInputs.whitelistTokenSettings.reduce((result, nextToken) => {
      const { id, gpSelector, ...rest } = nextToken;
      result[id] = {
        depositedBDV: depositAmounts[id].depositedBDV,
        germinatingBDV: germinationInfo[id],
        isWhitelisted: apyInputs.silo.whitelistedTokens.includes(id),
        isGauge: gpSelector != null,
        ...rest
      };
      return result;
    }, {});

    return allToBigInt(
      {
        silo: apyInputs.silo,
        tokens
      },
      ['whitelistedTokens', 'gpSelector']
    );
  }

  static async getBlockForSeason(beanstalk, season) {
    const result = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        seasons(where: {beanstalk: "${beanstalk}", season: ${season}}) {
          sunriseBlock
        }
      }`);
    return result.seasons[0]?.sunriseBlock;
  }
}

module.exports = BeanstalkSubgraphRepository;
