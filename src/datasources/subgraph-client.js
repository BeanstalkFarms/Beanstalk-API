const { GraphQLClient } = require('graphql-request');
const fs = require('fs');

const BASE_URL = 'https://graph.bean.money/';

class SubgraphClients {
  static _clients = {};

  static named(name) {
    return SubgraphClients.fromUrl(BASE_URL + name);
  }

  // let callNumber = 1;
  static fromUrl(url) {
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

  static _getClient(url) {
    if (!this._clients[url]) {
      this._clients[url] = new GraphQLClient(url);
    }
    return this._clients[url];
  }
}

module.exports = SubgraphClients;
