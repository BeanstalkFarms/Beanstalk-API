const { gql } = require('graphql-request');

class CommonSubgraphRepository {
  static async getMeta(client) {
    const meta = await client(gql`
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
          versionNumber
        }
      }
    `);
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
