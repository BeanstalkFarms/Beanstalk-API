require('dotenv').config();
const { GraphQLClient, gql } = require('graphql-request');

const BASE_URL = 'https://graph.node.bean.money/subgraphs/name/';
const STATUS_URL = 'http://graph.node.bean.money:8030/graphql';
const SLUGS = ['beanstalk', 'bean', 'basin', 'beanft'];

const DECENTRALIZED_BEANSTALK = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/CQgB9aDyd13X6rUtJcCWr8KtFpGGRMifu1mM6k4xQ9YA`
const DECENTRALIZED_BEAN = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/Hqtmas8CJUHXwFf7acS2sjaTw6tvdNQM3kaz2CqtYM3V`

const clients = {};

function getClient(url) {
  if (!clients[url]) {
    clients[url] = new GraphQLClient(url);
  }
  return clients[url];
}

function clientBuilder(url) {
  return async (query) => {
    const client = getClient(url);
    return await client.request(query);
  }
}

module.exports = {
  beanstalkSG: clientBuilder(BASE_URL + SLUGS[0]),
  beanSG: clientBuilder(BASE_URL + SLUGS[1]),
  basinSG: clientBuilder(BASE_URL + SLUGS[2]),
  beanftSG: clientBuilder(BASE_URL + SLUGS[3]),
  slugSG: (slug) => clientBuilder(BASE_URL + slug),
  graphBeanstalk: clientBuilder(DECENTRALIZED_BEANSTALK),
  graphBean: clientBuilder(DECENTRALIZED_BEAN),
  statusGql: clientBuilder(STATUS_URL),
  urlGql: clientBuilder,
  gql,
  SLUGS
}
