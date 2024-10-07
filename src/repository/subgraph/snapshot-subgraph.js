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
  static async getDelegations(chain, blockNumber) {
    const delegations = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.fromUrl(BASE_URL + IDS[chain]),
      gql`
        {
          delegations {
            id
            delegate
            delegator
            timestamp
          }
        }
      `,
      blockNumber ? `block: {number: ${blockNumber}}` : '',
      `space: "beanstalkdao.eth"`,
      {
        field: 'timestamp',
        lastValue: 0,
        direction: 'asc'
      }
    );
    return delegations.map((d) => ({ delegate: d.delegate, delegator: d.delegator }));
  }
}

module.exports = SnapshotSubgraphRepository;
