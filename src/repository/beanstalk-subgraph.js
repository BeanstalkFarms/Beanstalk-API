const { BigNumber } = require("alchemy-sdk");
const SubgraphClients = require("../datasources/subgraph-client");
const SubgraphQueryUtil = require("../utils/subgraph-query");
const { allToBigInt } = require("../utils/number");

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
      `id_in: [${accounts.map(a => `"${a}"`).join(', ')}]`,
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
    return allToBigInt(siloHourlySnapshots.reduce((result, next) => {
      result[next.season] = next.deltaBeanMints;
      return result;
    }, {}));
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
          id: "0xc1e088fc1323b20bcbee9bd1b9fc9546db5624c5",
          block: {number: ${blockNumber}}
        ) {
          seeds
          stalk
          depositedBDV
        }
      }`
    );
    const tokens = apyInputs.whitelistTokenSettings.reduce((result, nextToken) => {
      result[nextToken.id] = {
        baseStalk: nextToken.stalkIssuedPerBdv,
        grownStalkPerSeason: nextToken.stalkEarnedPerSeason
      }
      return result;
    }, {});
    return allToBigInt({
      silo: apyInputs.silo,
      tokens
    });
  }

  static async getBlockForSeason(beanstalk, season) {
    const result = await SubgraphClients.beanstalkSG(SubgraphClients.gql`
      {
        seasons(where: {beanstalk: "${beanstalk}", season: ${season}}) {
          sunriseBlock
        }
      }`
    );
    return result.seasons[0]?.sunriseBlock;
  }
}

module.exports = BeanstalkSubgraphRepository;
