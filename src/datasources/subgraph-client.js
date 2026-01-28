const { GraphQLClient } = require('graphql-request');
const fs = require('fs');

const BASE_URL = 'https://graph.bean.money/';

class SubgraphClients {
  static _clients = {};

  static baseUrl() {
    return BASE_URL;
  }

  static named(name) {
    return SubgraphClients.fromUrl(BASE_URL + name);
  }

  // let callNumber = 1;
  static fromUrl(url) {
    const requestFunction = async (query) => {
      const client = this._getClient(url);
      const res = await client.rawRequest(query);

      // Attach response metadata to the client function
      requestFunction.meta = {
        version: res.headers.get('x-version'),
        deployment: res.headers.get('x-deployment'),
        indexedBlock: res.headers.get('x-indexed-block')
      };

      // if (EnvUtil.getDeploymentEnv() === 'local') {
      //   // Use this to assist in mocking. Should be commented in/out as needed.
      //   await fs.promises.writeFile(
      //     `${__dirname}/../../test/mock-responses/subgraph/silo-apy/gaugeApyInputs_${callNumber++}.json`,
      //     JSON.stringify(response, null, 2)
      //   );
      //   console.log('wrote subgraph output to test directory');
      // }
      return res.data;
    };
    return requestFunction;
  }

  static _getClient(url) {
    if (!this._clients[url]) {
      this._clients[url] = new GraphQLClient(url);
    }
    return this._clients[url];
  }
}

module.exports = SubgraphClients;
