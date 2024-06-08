const { BigNumber } = require("alchemy-sdk");
const SubgraphClients = require("../datasources/subgraph-client");
const SubgraphQueryUtil = require("../utils/subgraph-query");

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
    return siloHourlySnapshots.reduce((result, next) => {
      result[next.season] = next.deltaBeanMints;
      return result;
    }, {});
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
