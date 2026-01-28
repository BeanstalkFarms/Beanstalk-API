const SubgraphClients = require('../../src/datasources/subgraph-client');
const EnvUtil = require('../../src/utils/env');

module.exports = {
  mockBeanstalkSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BEANSTALK}`),
  mockBeanSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BEAN}`),
  mockBasinSG: SubgraphClients._getClient(`https://graph.bean.money/${EnvUtil.getSG('eth').BASIN}`),
  mockWrappedSgReturnData: (data) => {
    return {
      data,
      headers: new Map([
        ['x-version', '1.0.0'],
        ['x-deployment', 'Qmcfyemdsh6Gw22mLZA797kswQiCYfQyXBNEEmFxYi72HN'],
        ['x-indexed-block', 41375750]
      ])
    };
  }
};
