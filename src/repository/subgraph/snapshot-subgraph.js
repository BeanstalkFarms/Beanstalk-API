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
  // Returns all addresses who have delegated to the given delegate.
  // Results are pooled across both ethereum/arbitrum delegations and any duplicates are removed.
  static async getDelegations(delegate, blockNumber) {
    // TODO: multichain
    const delegations = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.fromUrl(BASE_URL + IDS['eth']),
      gql`
        {
          delegations {
            delegator
            timestamp
          }
        }
      `,
      `block: {number: ${blockNumber}}`,
      `delegate: "${delegate.toLowerCase()}", space: "beanstalkdao.eth"`,
      ['timestamp'],
      [0],
      'asc'
    );
    const accounts = delegations.map((d) => d.delegator);
    return new Set(accounts);
  }
}

module.exports = SnapshotSubgraphRepository;
