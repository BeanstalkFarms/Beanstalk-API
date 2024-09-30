const { GraphQLClient } = require('graphql-request');
const fs = require('fs');

const BASE_URL = 'https://graph.bean.money/';

class SubgraphClients {
  static _clients = {};

  static namedSG(name) {
    return SubgraphClients._clientBuilder(BASE_URL + name);
  }

  static _getClient(url) {
    if (!this._clients[url]) {
      this._clients[url] = new GraphQLClient(url);
    }
    return this._clients[url];
  }

  // let callNumber = 1;
  static _clientBuilder(url) {
    return async (query) => {
      const client = this._getClient(url);
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
}

module.exports = SubgraphClients;
