const { BEANSTALK, BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP } = require('../src/constants/addresses');
const { PRECISION } = require('../src/constants/constants');
const subgraphClient = require('../src/datasources/subgraph-client');
const SiloApyService = require('../src/service/silo-apy');
const GaugeApyUtil = require('../src/utils/apy/gauge');
const PreGaugeApyUtil = require('../src/utils/apy/pre-gauge');
const { toBigInt } = require('../src/utils/number');

describe('Window EMA', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate window EMA', async () => {
    const rewardMintResponse = require('./mock-responses/subgraph/silo-apy/siloHourlyRewardMints_1.json');
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
    const rewardMintResponse = require('./mock-responses/subgraph/silo-apy/siloHourlyRewardMints_2.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(rewardMintResponse);

    const emaResult = await SiloApyService.calcWindowEMA(BEANSTALK, 6100, [10000, 20000]);

    expect(emaResult[0].beansPerSeason).not.toBeNaN();
    expect(emaResult[0].beansPerSeason).toEqual(emaResult[1].beansPerSeason);
  });
});

describe('Pre-Gauge Silo APY', () => {
  it('should calculate basic apy', () => {
    const apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN', 'BEAN:WETH'],
      [3000000n, 4500000n],
      3000000n,
      1636664801904743831n,
      24942000280720n
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.14346160171559408);
    expect(apy['BEAN'].stalk).toBeCloseTo(2.929361317570831);
    expect(apy['BEAN'].ownership).toBeCloseTo(2.041655409481871);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.18299360215739835);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(4.318722210196328);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(3.1169670763419854);
  });

  it('should calculate with optional inputs', () => {
    let apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN', 'BEAN:WETH'],
      [3000000n, 4500000n],
      3000000n,
      1636664801904743831n,
      24942000280720n,
      // User starts with a deposit
      {
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
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.24004075111638348);
    expect(apy['BEAN'].stalk).toBeCloseTo(1.2621145577496613);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.7511709069463572);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.28835009461615935);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(1.0058288057734435);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(0.5527723991483761);

    apy = PreGaugeApyUtil.calcApy(1278000000n, ['BEAN'], [3000000n], 3000000n, 1636664801904743831n, 24942000280720n, {
      duration: 720 // 1 month
    });

    expect(apy['BEAN'].bean).toBeCloseTo(0.006192371151397369);
    expect(apy['BEAN'].stalk).toBeCloseTo(0.22283975910921727);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.20216140896555207);
  });
});

describe('Gauge Silo APY', () => {
  it('should calculate with required inputs', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, PRECISION.bdv),
      [BEAN, BEANWETH, UNRIPE_BEAN],
      [-1, 0, -2],
      [toBigInt(100, PRECISION.gaugePoints)],
      [toBigInt(899088, PRECISION.bdv)],
      toBigInt(44139839, PRECISION.bdv),
      [toBigInt(100, PRECISION.optimalPercentDepositedBdv)],
      toBigInt(0.33, PRECISION.beanToMaxLpGpPerBdvRatio),
      toBigInt(2798474, PRECISION.bdv),
      toBigInt(161540879, PRECISION.stalk),
      0,
      [0n, 0n],
      [[0n, 0n]],
      [0n, 0n],
      [null, null, 0n]
    );

    expect(apy[BEAN].bean).toBeCloseTo(0.35084711071357977);
    expect(apy[BEAN].stalk).toBeCloseTo(1.6586973099708102);
    expect(apy[BEAN].ownership).toBeCloseTo(0.9537401121405971);

    expect(apy[BEANWETH].bean).toBeCloseTo(0.4798080252579915);
    expect(apy[BEANWETH].stalk).toBeCloseTo(3.093009778951926);
    expect(apy[BEANWETH].ownership).toBeCloseTo(2.007742684559264);

    expect(apy[UNRIPE_BEAN].bean).toBeCloseTo(0.221615077591919);
    expect(apy[UNRIPE_BEAN].stalk).toBeCloseTo(0.22288696036564187);
    expect(apy[UNRIPE_BEAN].ownership).toBeCloseTo(-0.10136317582302204);
  });

  it.only('should calculate with optional inputs', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, PRECISION.bdv),
      [BEAN, BEANWETH],
      [-1, 0],
      [toBigInt(100, PRECISION.gaugePoints)],
      [toBigInt(899088, PRECISION.bdv)],
      toBigInt(44139839, PRECISION.bdv),
      [toBigInt(100, PRECISION.optimalPercentDepositedBdv)],
      toBigInt(0.33, PRECISION.beanToMaxLpGpPerBdvRatio),
      toBigInt(2798474, PRECISION.bdv),
      toBigInt(161540879, PRECISION.stalk),
      0,
      [0n, toBigInt(1500000, PRECISION.bdv)],
      [[toBigInt(500000, PRECISION.bdv), 0n]],
      [toBigInt(1000000, PRECISION.bdv), toBigInt(500000, PRECISION.bdv)],
      [null, null]
    );

    console.log(apy);
  });
});

describe('SiloApyService Orchestration', () => {
  beforeEach(() => {
    jest.spyOn(SiloApyService, 'calcWindowEMA').mockResolvedValue([{ window: 720, beansPerSeason: 322227371n }]);
  });

  it('pre-gauge should supply appropriate parameters', async () => {
    const seasonBlockResponse = require('./mock-responses/subgraph/silo-apy/preGaugeApyInputs_1.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(seasonBlockResponse);
    const preGaugeApyInputsResponse = require('./mock-responses/subgraph/silo-apy/preGaugeApyInputs_2.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(preGaugeApyInputsResponse);

    const spy = jest.spyOn(PreGaugeApyUtil, 'calcApy');
    spy.mockReturnValueOnce({
      [BEAN]: {
        bean: 0.1,
        stalk: 5,
        ownership: 1.5
      },
      [BEAN3CRV]: {
        bean: 0.12,
        stalk: 5.5,
        ownership: 1.7
      }
    });

    const result = await SiloApyService.calcApy(BEANSTALK, 19000, [720], [BEAN, BEAN3CRV]);

    expect(spy).toHaveBeenCalledWith(
      322227371n,
      ['0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab', '0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49'],
      [3000000n, 3250000n],
      3000000n,
      1448607918287565335n,
      29993650158762n
    );

    expect(result.beanstalk).toEqual(BEANSTALK);
    expect(result.season).toEqual(19000);
    expect(result.yields[720][BEAN].bean).toEqual(0.1);
    expect(result.yields[720][BEAN3CRV].stalk).toEqual(5.5);
  });

  it('gauge should supply appropriate parameters', async () => {
    const seasonBlockResponse = require('./mock-responses/subgraph/silo-apy/gaugeApyInputs_1.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(seasonBlockResponse);
    const preGaugeApyInputsResponse = require('./mock-responses/subgraph/silo-apy/gaugeApyInputs_2.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValueOnce(preGaugeApyInputsResponse);

    const spy = jest.spyOn(GaugeApyUtil, 'calcApy');
    spy.mockReturnValueOnce({
      [BEAN]: {
        bean: 0.1,
        stalk: 5,
        ownership: 1.5
      },
      [BEAN3CRV]: {
        bean: 0.12,
        stalk: 5.5,
        ownership: 1.7
      },
      [BEANWETH]: {
        bean: 0.19,
        stalk: 8.5,
        ownership: 3.7
      },
      [UNRIPE_BEAN]: {
        bean: 0.02,
        stalk: 1.5,
        ownership: 0.7
      }
    });

    const result = await SiloApyService.calcApy(BEANSTALK, 22096, [720], [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN]);
    // console.log('outer apy result', result);

    expect(spy).toHaveBeenCalledWith(
      322227371n,
      [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN],
      [-1, -2, 0, -2],
      [100000000000000000000n],
      [1876895701119n],
      44983287794775n,
      [100000000n],
      100000000000000000000n,
      4496580226358n,
      1718032876867569323n,
      22096,
      [0n, 2059972416n],
      [[0n, 0n]],
      [0n, 0n],
      [null, 1n, null, 1n]
    );

    expect(result.beanstalk).toEqual(BEANSTALK);
    expect(result.season).toEqual(22096);
    expect(result.yields[720][BEAN].bean).toEqual(0.1);
    expect(result.yields[720][BEAN3CRV].stalk).toEqual(5.5);
  });
});
