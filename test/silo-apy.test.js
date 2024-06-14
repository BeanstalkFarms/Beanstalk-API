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
      44103977396567n,
      1636664801904743831n,
      24942000280720n
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.318007383109455);
    expect(apy['BEAN'].stalk).toBeCloseTo(0.8994181156045856);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.4703966838366106);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.35754513429389356);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(1.2738188145791554);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(0.7602315241361547);
  });

  it('should calculate with optional inputs', () => {
    let apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN', 'BEAN:WETH'],
      [3000000n, 4500000n],
      3000000n,
      44103977396567n,
      1636664801904743831n,
      24942000280720n,
      // User starts with a deposit
      {
        initUserValues: [
          {
            stalkPerBdv: 2.5
          },
          {
            stalkPerBdv: 3.25
          }
        ]
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.24004075111638348);
    expect(apy['BEAN'].stalk).toBeCloseTo(1.2621145577496613);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.7511709069463572);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.327868076925108);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(1.4331142254568838);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(0.883546892132657);

    apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN'],
      [3000000n],
      3000000n,
      44103977396567n,
      1636664801904743831n,
      24942000280720n,
      {
        initType: 'NEW',
        duration: 720 // 1 month
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.006192371151397369);
    expect(apy['BEAN'].stalk).toBeCloseTo(0.22283975910921727);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.20216140896555207);
  });
});

describe('Gauge Silo APY', () => {
  it('should calculate with required inputs', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, PRECISION.bdv),
      [BEAN, BEANWETH, UNRIPE_BEAN, UNRIPE_LP],
      [-1, 0, -2, -2],
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
      [null, null, 0n, toBigInt(4, PRECISION.seeds)]
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

    expect(apy[UNRIPE_LP].bean).toBeCloseTo(0.3272446909167759);
    expect(apy[UNRIPE_LP].stalk).toBeCloseTo(1.3440728289283832);
    expect(apy[UNRIPE_LP].ownership).toBeCloseTo(0.7225387389836214);
  });

  it('should calculate with optional inputs', () => {
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
      [null, null],
      {
        // User starts with a specific deposit
        initUserValues: [
          {
            // Scenario: 40 stalk on a 15 bean deposit, with 30 beans germinating
            stalkPerBdv: 40 / (15 + 30),
            germinating: [30 / (15 + 30), 0]
          },
          {
            stalkPerBdv: 3.25
          }
        ],
        // 6 months only
        duration: 720 * 6
      }
    );

    expect(apy[BEAN].bean).toBeCloseTo(0.08433852683524257);
    expect(apy[BEAN].stalk).toBeCloseTo(1.4368925863369826);
    expect(apy[BEAN].ownership).toBeCloseTo(1.157895699654514);

    expect(apy[BEANWETH].bean).toBeCloseTo(0.17316920083743503);
    expect(apy[BEANWETH].stalk).toBeCloseTo(1.3770764147879906);
    expect(apy[BEANWETH].ownership).toBeCloseTo(1.104927809285005);
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
      44103977396567n,
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
