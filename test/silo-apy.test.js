const { BEANSTALK } = require("../src/constants/addresses");
const subgraphClient = require("../src/datasources/subgraph-client");
const { calcWindowEMA } = require("../src/service/silo-apy");

describe('Silo APY', () => {

  describe('Window EMA', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should calculate window EMA', async () => {
      const rewardMintResponse = require('./mock-responses/subgraph/siloHourlyRewardMints_1.json')
      jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(rewardMintResponse);

      const emaResult = await calcWindowEMA(BEANSTALK, 21816, [24, 168, 720]);
      
      expect(emaResult[0]).toEqual({
        window: 24,
        beansPerSeason: 35095777357
      });
      expect(emaResult[1]).toEqual({
        window: 168,
        beansPerSeason: 11144518350
      });
      expect(emaResult[2]).toEqual({
        window: 720,
        beansPerSeason: 3250542305
      });
    });
  
    it('should fail on invalid seasons or windows', async () => {
      await expect(calcWindowEMA(BEANSTALK, 6000, [24])).rejects.toThrow();
      await expect(calcWindowEMA(BEANSTALK, 21816, [0])).rejects.toThrow();
    });

    it('should use up to as many season as are available', async () => {
      const rewardMintResponse = require('./mock-responses/subgraph/siloHourlyRewardMints_2.json')
      jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(rewardMintResponse);

      const emaResult = await calcWindowEMA(BEANSTALK, 6100, [10000, 20000]);

      expect(emaResult[0].beansPerSeason).not.toBeNaN();
      expect(emaResult[0].beansPerSeason).toEqual(emaResult[1].beansPerSeason);
    });
  });
});