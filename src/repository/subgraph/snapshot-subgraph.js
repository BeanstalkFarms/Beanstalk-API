const { gql } = require('graphql-request');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const SubgraphClients = require('../../datasources/subgraph-client');
const EnvUtil = require('../../utils/env');

const BASE_URL = `https://gateway-arbitrum.network.thegraph.com/api/${EnvUtil.getGraphKey()}/subgraphs/id/`;
const IDS = {
  eth: '4YgtogVaqoM8CErHWDK8mKQ825BcVdKB8vBYmb4avAQo',
  arb: 'HuLBhuKuknXEEUmVmKR8Lsmpi5h1SfNLGcaa1e9tWyMG'
};

class SnapshotSubgraphRepository {
  // Returns all addresses who have delegated to the given delegate on the requested chain.
  static async getDelegations(delegate, chain, blockNumber) {
    const delegations = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.fromUrl(BASE_URL + IDS[chain]),
      gql`
        {
          delegations {
            delegator
            timestamp
          }
        }
      `,
      blockNumber ? `block: {number: ${blockNumber}}` : '',
      `delegate: "${delegate}", space: "beanstalkdao.eth"`,
      ['timestamp'],
      [0],
      'asc'
    );
    return delegations.map((d) => d.delegator);
  }
}

module.exports = SnapshotSubgraphRepository;
