const SubgraphClients = require('../../src/datasources/subgraph-client');
const EnvUtil = require('../../src/utils/env');

module.exports = {
  mockBeanstalkSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BEANSTALK}`),
  mockBeanSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BEAN}`),
  mockBasinSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BASIN}`)
};
