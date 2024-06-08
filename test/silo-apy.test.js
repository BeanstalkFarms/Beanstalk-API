const { BEANSTALK } = require("../src/constants/addresses");
const subgraphClient = require("../src/datasources/subgraph-client");
const { calcWindowEMA } = require("../src/service/silo-apy");
const { calcApyPreGauge } = require("../src/utils/apy/pre-gauge");

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

describe('Pre-Gauge Silo APY', () => {

  it('should calculate basic apy', () => {
    const apy = calcApyPreGauge({
      beansPerSeason: 1278000000,
      tokens: ['BEAN', 'BEAN:WETH'],
      seedsPerTokenBdv: [3000000, 4500000],
      seedsPerBeanBdv: 3000000,
      totalStalk: 1636664801904743831,
      totalSeeds: 24942000280720
    });
    
    expect(apy[0].beanYield).toBeCloseTo(0.14346160171559408);
    expect(apy[0].stalkYield).toBeCloseTo(2.929361317570831);
    expect(apy[0].ownershipGrowth).toBeCloseTo(2.041655409481871);

    expect(apy[1].beanYield).toBeCloseTo(0.18299360215739835);
    expect(apy[1].stalkYield).toBeCloseTo(4.318722210196328);
    expect(apy[1].ownershipGrowth).toBeCloseTo(3.1169670763419854);
  });

  it('should calculate with optional inputs', () => {
    let apy = calcApyPreGauge({
      beansPerSeason: 1278000000,
      tokens: ['BEAN', 'BEAN:WETH'],
      seedsPerTokenBdv: [3000000, 4500000],
      seedsPerBeanBdv: 3000000,
      totalStalk: 1636664801904743831,
      totalSeeds: 24942000280720,
      // User starts with a deposit
      initialUserValues: [
        {
          bdv: 2000 * Math.pow(10, 6),
          stalk: 5000 * Math.pow(10, 10)
        },
        {
          bdv: 2000 * Math.pow(10, 6),
          stalk: 6500 * Math.pow(10, 10)
        }
      ]
    });

    expect(apy[0].beanYield).toBeCloseTo(0.24004075085759974);
    expect(apy[0].stalkYield).toBeCloseTo(1.262114557519065);
    expect(apy[0].ownershipGrowth).toBeCloseTo(0.7511041890951874);

    expect(apy[1].beanYield).toBeCloseTo(0.2883411617711251);
    expect(apy[1].stalkYield).toBeCloseTo(1.0058229586659946);
    expect(apy[1].ownershipGrowth).toBeCloseTo(0.5526664099665303);

    apy = calcApyPreGauge({
      beansPerSeason: 1278000000,
      tokens: ['BEAN'],
      seedsPerTokenBdv: [3000000],
      seedsPerBeanBdv: 3000000,
      totalStalk: 1636664801904743831,
      totalSeeds: 24942000280720,
      duration: 720 // 1 month
    });
    
    expect(apy[0].beanYield).toBeCloseTo(0.006192371144229325);
    expect(apy[0].stalkYield).toBeCloseTo(0.2228397591012936);
    expect(apy[0].ownershipGrowth).toBeCloseTo(0.2018846550220293);
  });
});
