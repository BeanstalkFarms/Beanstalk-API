require('dotenv').config();
const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs');

const BASE_URL = 'https://graph.node.bean.money/subgraphs/name/';
const STATUS_URL = 'http://graph.node.bean.money:8030/graphql';
const SLUGS = [
  (process.env.SG_BEANSTALK ?? '') !== '' ? process.env.SG_BEANSTALK : 'beanstalk',
  (process.env.SG_BEAN ?? '') !== '' ? process.env.SG_BEAN : 'bean',
  (process.env.SG_BASIN ?? '') !== '' ? process.env.SG_BASIN : 'basin',
  (process.env.SG_BEANFT ?? '') !== '' ? process.env.SG_BEANFT : 'beanft'
];

const DECENTRALIZED_BEANSTALK = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/CQgB9aDyd13X6rUtJcCWr8KtFpGGRMifu1mM6k4xQ9YA`;
const DECENTRALIZED_BEAN = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/Hqtmas8CJUHXwFf7acS2sjaTw6tvdNQM3kaz2CqtYM3V`;

const clients = {};

function getClient(url) {
  if (!clients[url]) {
    clients[url] = new GraphQLClient(url);
  }
  return clients[url];
}

// let callNumber = 1;
function clientBuilder(url) {
  return async (query) => {
    const client = getClient(url);
    const response = await client.request(query);

    // if (process.env.NODE_ENV === 'local') {
    //   // Use this to assist in mocking. Should be commented in/out as needed.
    //   await fs.promises.writeFile(
    //     `${__dirname}/../../test/mock-responses/subgraph/silo-apy/gaugeApyInputs_${callNumber++}.json`,
    //     JSON.stringify(response, null, 2)
    //   );
    //   console.log('wrote subgraph output to test directory');
    // }
    return response;
  };
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
};
