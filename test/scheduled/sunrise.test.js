const subgraphClient = require('../../src/datasources/subgraph-client');
const SunriseTask = require('../../src/scheduled/tasks/sunrise');
const OnSunriseUtil = require('../../src/scheduled/util/on-sunrise');

async function checkLastPromiseResult(spy, expected) {
  const lastCallResult = await spy.mock.results[spy.mock.results.length - 1].value;
  expect(lastCallResult).toBe(expected);
}

describe('OnSunrise', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(1700938811 * 1000));
    jest.spyOn(OnSunriseUtil, 'failureCallback').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('identifies when the subgraphs have processed the new season', async () => {
    const seasonResponse = require('../mock-responses/subgraph/scheduled/sunrise/beanstalkSeason_1.json');
    const beanstalkSGSpy = jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(seasonResponse);

    const metaNotReady = require('../mock-responses/subgraph/scheduled/sunrise/metaNotReady.json');
    const beanSGSpy = jest.spyOn(subgraphClient, 'beanSG').mockResolvedValue(metaNotReady);
    const basinSGSpy = jest.spyOn(subgraphClient, 'basinSG').mockResolvedValue(metaNotReady);

    const checkSpy = jest.spyOn(OnSunriseUtil, 'checkSubgraphsForSunrise');

    const waitPromise = OnSunriseUtil.waitForSunrise(17500);
    await checkLastPromiseResult(checkSpy, false);

    const seasonResponse2 = require('../mock-responses/subgraph/scheduled/sunrise/beanstalkSeason_2.json');
    beanstalkSGSpy.mockResolvedValue(seasonResponse2);
    // Fast-forward timers and continue
    jest.advanceTimersByTime(5000);
    jest.runAllTimers();
    await checkLastPromiseResult(checkSpy, false);

    // Now, bean/basin are ready also
    const metaReady = require('../mock-responses/subgraph/scheduled/sunrise/metaReady.json');
    beanSGSpy.mockResolvedValueOnce(metaReady);
    basinSGSpy.mockResolvedValueOnce(metaReady);

    jest.advanceTimersByTime(5000);
    jest.runAllTimers();
    await checkLastPromiseResult(checkSpy, true);

    await expect(waitPromise).resolves.toBeUndefined();
  });

  test('fails to identify a new season within the time limit', async () => {
    const seasonResponse = require('../mock-responses/subgraph/scheduled/sunrise/beanstalkSeason_1.json');
    jest.spyOn(subgraphClient, 'beanstalkSG').mockResolvedValue(seasonResponse);

    const checkSpy = jest.spyOn(OnSunriseUtil, 'checkSubgraphsForSunrise');

    const waitPromise = OnSunriseUtil.waitForSunrise(7500);
    await checkLastPromiseResult(checkSpy, false);

    // Fast-forward timers and continue
    jest.advanceTimersByTime(5000);
    jest.runAllTimers();
    await checkLastPromiseResult(checkSpy, false);

    jest.advanceTimersByTime(5000);
    jest.runAllTimers();
    await checkLastPromiseResult(checkSpy, false);

    await expect(waitPromise).rejects.toBeUndefined();
  });
});
