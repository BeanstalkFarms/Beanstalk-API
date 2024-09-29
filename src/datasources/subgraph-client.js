const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs');
const EnvUtil = require('../utils/env');

const BASE_URL = 'https://graph.bean.money/';
const SLUGS = [EnvUtil.getSGBeanstalk(), EnvUtil.getSGBean(), EnvUtil.getSGBasin()];

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

    // if (EnvUtil.getDeploymentEnv() === 'local') {
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
  slugSG: (slug) => clientBuilder(BASE_URL + slug),
  urlGql: clientBuilder,
  gql,
  SLUGS
};
