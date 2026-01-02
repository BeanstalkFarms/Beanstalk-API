const { gql } = require('graphql-request');
const SubgraphClients = require('../../datasources/subgraph-client');
const axios = require('axios');

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

  static async introspect(sgName) {
    const introspection = await axios.post(`${SubgraphClients.baseUrl()}${sgName}`, {
      query:
        'query IntrospectionQuery { __schema { queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description locations args { ...InputValue } } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } } fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }'
    });

    const deployment = introspection.headers['x-deployment'];
    const schema = introspection.data.data.__schema;

    return { deployment, schema };
  }
}

module.exports = CommonSubgraphRepository;
