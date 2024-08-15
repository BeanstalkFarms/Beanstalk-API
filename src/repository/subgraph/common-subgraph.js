const SubgraphClient = require('../../datasources/subgraph-client');

class CommonSubgraphRepository {
  // TODO: once new version entity rollout is complete, add those results here and abstract the return format.
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
      }`);
    return meta._meta;
  }

  static async getNodeStatus(statusClient) {
    const status = await statusClient(SubgraphClient.gql`
      {
        indexingStatuses {
          subgraph
          synced
          health
          fatalError {
            message
          }
          chains {
            chainHeadBlock {
              number
            }
            earliestBlock {
              number
            }
            latestBlock {
              number
            }
          }
        }
      }`);
    return status.indexingStatuses;
  }

  static async getAlchemyStatus(alchemyStatusClient) {
    const status = await alchemyStatusClient(SubgraphClient.gql`
      {
        indexingStatusForCurrentVersion {
          subgraph
          synced
          health
          fatalError {
            message
          }
          chains {
            chainHeadBlock {
              number
            }
            latestBlock {
              number
            }
          }
        }
      }`);
    return status.indexingStatusForCurrentVersion;
  }
}

module.exports = CommonSubgraphRepository;
