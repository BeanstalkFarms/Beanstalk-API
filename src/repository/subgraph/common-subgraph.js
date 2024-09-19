const SubgraphClient = require('../../datasources/subgraph-client');

class CommonSubgraphRepository {
  static async getMeta(client) {
    const meta = await client(SubgraphClient.gql`
      {
        _meta {
          deployment
          hasIndexingErrors
          block {
            number
          }
        }
        version(id: "subgraph") {
          subgraphName
          chain
          versisonNumber
        }
      }`);
    return {
      deployment: meta._meta.deployment,
      block: meta._meta.block.number,
      subgraphName: meta.version.subgraphName,
      chain: meta.version.chain,
      versionNumber: meta.version.versionNumber
    };
  }
}

module.exports = CommonSubgraphRepository;
