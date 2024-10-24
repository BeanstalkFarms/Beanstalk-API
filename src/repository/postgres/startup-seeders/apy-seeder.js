const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');

class ApySeeder {
  static async run() {
    const currentSeason = await BeanstalkSubgraphRepository.getLatestSeason();
    // Find all missing seasons
    console.log('Current season', currentSeason);
  }
}
module.exports = ApySeeder;
