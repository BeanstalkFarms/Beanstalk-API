const DepositEvents = require('../../src/datasources/events/deposit-events');
const DepositsTask = require('../../src/scheduled/tasks/deposits');
const DepositService = require('../../src/service/deposit-service');
const { allToBigInt } = require('../../src/utils/number');

describe('Deposits Task', () => {
  test('Identifies net deposit activity over block range', async () => {
    const events = require('../mock-responses/events/getSiloDepositEventsCollapsed.json');
    jest.spyOn(DepositEvents, 'getSiloDepositEventsCollapsed').mockResolvedValue(allToBigInt(events, ['type']));

    const netActivity = await DepositsTask.getNetChange(100, 200);

    expect(netActivity['abc|beantoken|-123456'].amount).toEqual(4500000n);
    expect(netActivity['def|beantoken|10'].amount).toEqual(-1600000n);
    expect(netActivity['ghi|urbean|-123456']).toBeUndefined();
  });

  test('Updates current values', async () => {
    const deposits = [
      {
        account: 'abc',
        token: 'bean',
        stem: 500n,
        depositedAmount: 50n,
        depositedBdv: 50n,
        setStalkAndSeeds: jest.fn()
      },
      {
        account: 'def',
        token: 'bean',
        stem: 500n,
        depositedAmount: 50n,
        depositedBdv: 50n,
        setStalkAndSeeds: jest.fn()
      }
    ];
    const activity = {
      'abc|bean|500': {
        amount: 10n,
        bdv: 10n
      },
      'def|bean|500': {
        amount: -50n,
        bdv: -50n
      },
      'def|bean|600': {
        amount: 250n,
        bdv: 250n
      }
    };
    const tokenInfos = {
      bean: { stalkIssuedPerBdv: 10000000000n, stalkEarnedPerSeason: 5000000n, stemTip: 40000000000n }
    };

    jest.spyOn(DepositService, 'getMowStems').mockResolvedValue({
      'abc|bean': 0n,
      'def|bean': 50n
    });

    const { toDelete, toUpsert } = await DepositsTask.updateDtoList(deposits, activity, tokenInfos);

    expect(toDelete.length).toBe(1);
    expect(toDelete[0].account).toBe('def');
    expect(toUpsert.length).toBe(2);
  });
});
