const SubgraphClients = require('../../datasources/subgraph-client');

class CommonSubgraphRepository {
  static async getMeta(client) {
    const meta = await client(SubgraphClients.gql`
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
}

module.exports = CommonSubgraphRepository;
