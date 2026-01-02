const { ApolloServer } = require('@apollo/server');
const { koaMiddleware } = require('@as-integrations/koa');
const GraphQLSchema = require('./schema');

const initGraphql = async (router) => {
  const { typeDefs, resolvers } = await GraphQLSchema.getTypeDefsAndResolvers();
  const apollo = new ApolloServer({
    typeDefs,
    resolvers
  });
  await apollo.start();

  router.all('/graphql', koaMiddleware(apollo));
};
module.exports = initGraphql;
