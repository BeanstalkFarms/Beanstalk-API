const { SG_CACHE_CONFIG } = require('../../repository/subgraph/cache-config');
const SubgraphCache = require('../../repository/subgraph/subgraph-cache');

class GraphQLSchema {
  static async getTypeDefsAndResolvers() {
    const subgraphQueries = Object.values(SG_CACHE_CONFIG).reduce((acc, next) => {
      (acc[next.subgraph] ??= []).push(next.queryName);
      return acc;
    }, {});
    let introspection = {};
    for (const subgraphName in subgraphQueries) {
      introspection = { ...introspection, ...(await SubgraphCache.introspect(subgraphName)) };
    }

    const typeDefs = `
      scalar BigInt
      scalar BigDecimal
      scalar Bytes
      ${Object.keys(introspection).map(
        (query) =>
          `type ${introspection[query].type} {
            ${introspection[query].fields
              .filter((f) => !SG_CACHE_CONFIG[query].omitFields?.includes(f.name))
              .concat(
                SG_CACHE_CONFIG[query].syntheticFields?.map((f) => ({
                  name: f.objectRewritePath,
                  typeName: f.typeName
                })) ?? []
              )
              .map((f) => `${f.name}: ${f.typeName}`)
              .join('\n')}
          }`
      )}
      type Query {
        ${Object.keys(introspection)
          .map(
            (query) =>
              `${query}(where: String, orderBy: String, orderDirection: String, skip: Int, first: Int): [${introspection[query].type}!]!`
          )
          .join('\n')}
      }
    `;

    const resolvers = {
      Query: Object.keys(SG_CACHE_CONFIG).reduce((acc, configKey) => {
        // Each query supports generic where clause, and order/pagination related args
        acc[configKey] = async (_parent, { where, ...args }, _ctx) => {
          const results = await SubgraphCache.get(configKey, where ?? '');

          if (args.orderBy && args.orderDirection) {
            results.sort((a, b) => {
              if (args.orderDirection === 'asc') {
                return a[args.orderBy] - b[args.orderBy];
              }
              return b[args.orderBy] - a[args.orderBy];
            });
          }

          return results.slice(args.skip ?? 0, !!args.first ? (args.skip ?? 0) + args.first : undefined);
        };
        return acc;
      }, {})
    };

    return { typeDefs, resolvers };
  }
}

module.exports = GraphQLSchema;

if (require.main === module) {
  (async () => {
    const { typeDefs, resolvers } = await GraphQLSchema.getTypeDefsAndResolvers();
    console.log(typeDefs);
    console.log(resolvers);
  })();
}
