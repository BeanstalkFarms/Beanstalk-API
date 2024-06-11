const { BEANSTALK, BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP } = require("../src/constants/addresses");
const subgraphClient = require("../src/datasources/subgraph-client");
const SiloApyService = require("../src/service/silo-apy");
const PreGaugeApyUtil = require("../src/utils/apy/pre-gauge");

describe('Window EMA', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate window EMA', async () => {
    const rewardMintResponse = require('./mock-responses/subgraph/siloHourlyRewardMints_1.json')
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(rewardMintResponse);

    const emaResult = await SiloApyService.calcWindowEMA(BEANSTALK, 21816, [24, 168, 720]);
    
    expect(emaResult[0]).toEqual({
      window: 24,
      beansPerSeason: 35095777357n
    });
    expect(emaResult[1]).toEqual({
      window: 168,
      beansPerSeason: 11144518350n
    });
    expect(emaResult[2]).toEqual({
      window: 720,
      beansPerSeason: 3250542305n
    });
  });

  it('should fail on invalid seasons or windows', async () => {
    await expect(SiloApyService.calcWindowEMA(BEANSTALK, 6000, [24])).rejects.toThrow();
    await expect(SiloApyService.calcWindowEMA(BEANSTALK, 21816, [0])).rejects.toThrow();
  });

  it('should use up to as many season as are available', async () => {
    const rewardMintResponse = require('./mock-responses/subgraph/siloHourlyRewardMints_2.json')
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(rewardMintResponse);

    const emaResult = await SiloApyService.calcWindowEMA(BEANSTALK, 6100, [10000, 20000]);

    expect(emaResult[0].beansPerSeason).not.toBeNaN();
    expect(emaResult[0].beansPerSeason).toEqual(emaResult[1].beansPerSeason);
  });
});

describe('Pre-Gauge Silo APY', () => {

  it('should calculate basic apy', () => {
    const apy = PreGaugeApyUtil.calcApy({
      beansPerSeason: 1278000000n,
      tokens: ['BEAN', 'BEAN:WETH'],
      seedsPerTokenBdv: [3000000n, 4500000n],
      seedsPerBeanBdv: 3000000n,
      totalStalk: 1636664801904743831n,
      totalSeeds: 24942000280720n
    });
    
    expect(apy[0].beanYield).toBeCloseTo(0.14346160171559408);
    expect(apy[0].stalkYield).toBeCloseTo(2.929361317570831);
    expect(apy[0].ownershipGrowth).toBeCloseTo(2.041655409481871);

    expect(apy[1].beanYield).toBeCloseTo(0.18299360215739835);
    expect(apy[1].stalkYield).toBeCloseTo(4.318722210196328);
    expect(apy[1].ownershipGrowth).toBeCloseTo(3.1169670763419854);
  });

  it('should calculate with optional inputs', () => {
    let apy = PreGaugeApyUtil.calcApy({
      beansPerSeason: 1278000000n,
      tokens: ['BEAN', 'BEAN:WETH'],
      seedsPerTokenBdv: [3000000n, 4500000n],
      seedsPerBeanBdv: 3000000n,
      totalStalk: 1636664801904743831n,
      totalSeeds: 24942000280720n,
      // User starts with a deposit
      initialUserValues: [
        {
          bdv: 2000n * BigInt(10 ** 6),
          stalk: 5000n * BigInt(10 ** 10)
        },
        {
          bdv: 2000n * BigInt(10 ** 6),
          stalk: 6500n * BigInt(10 ** 10)
        }
      ]
    });

    expect(apy[0].beanYield).toBeCloseTo(0.24004075085759974);
    expect(apy[0].stalkYield).toBeCloseTo(1.262114557519065);
    expect(apy[0].ownershipGrowth).toBeCloseTo(0.7511041890951874);

    expect(apy[1].beanYield).toBeCloseTo(0.2883411617711251);
    expect(apy[1].stalkYield).toBeCloseTo(1.0058229586659946);
    expect(apy[1].ownershipGrowth).toBeCloseTo(0.5526664099665303);

    apy = PreGaugeApyUtil.calcApy({
      beansPerSeason: 1278000000n,
      tokens: ['BEAN'],
      seedsPerTokenBdv: [3000000n],
      seedsPerBeanBdv: 3000000n,
      totalStalk: 1636664801904743831n,
      totalSeeds: 24942000280720n,
      duration: 720 // 1 month
    });
    
    expect(apy[0].beanYield).toBeCloseTo(0.006192371144229325);
    expect(apy[0].stalkYield).toBeCloseTo(0.2228397591012936);
    expect(apy[0].ownershipGrowth).toBeCloseTo(0.2018846550220293);
  });
});

describe('SiloApyService Orchestration', () => {

  beforeEach(() => {
    jest.spyOn(SiloApyService, 'calcWindowEMA').mockResolvedValue([ { window: 720, beansPerSeason: 322227371n } ]);
    const seasonBlockResponse = require('./mock-responses/subgraph/preGaugeApyInputs_1.json')
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(seasonBlockResponse);
  });
  
  it('pre-gauge should supply appropriate parameters', async () => {
    const preGaugeApyInputsResponse = require('./mock-responses/subgraph/preGaugeApyInputs_2.json')
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(preGaugeApyInputsResponse);
    
    const spy = jest.spyOn(PreGaugeApyUtil, 'calcApy');
    spy.mockReturnValueOnce([
      {
        token: BEAN,
        beanYield: 0.10,
        stalkYield: 5,
        ownershipGrowth: 1.5
      },
      {
        token: BEAN3CRV,
        beanYield: 0.12,
        stalkYield: 5.5,
        ownershipGrowth: 1.7
      }
    ]);

    const result = await SiloApyService.calcApy({
      beanstalk: BEANSTALK,
      season: 19000,
      windows: [720],
      tokens: [BEAN, BEAN3CRV]
    });

    expect(spy).toHaveBeenCalledWith({
      beansPerSeason: 322227371n,
      tokens: [
        '0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab',
        '0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49'
      ],
      seedsPerTokenBdv: [ 3000000n, 3250000n ],
      seedsPerBeanBdv: 3000000n,
      totalStalk: 1448607918287565335n,
      totalSeeds: 29993650158762n
    });

    expect(result[0].season).toEqual(19000);
    expect(result[0].apys[0].beanYield).toEqual(0.10);
    expect(result[0].apys[1].stalkYield).toEqual(5.5);
  });

  // it('gauge should supply appropriate parameters', async () => {

  // });
});