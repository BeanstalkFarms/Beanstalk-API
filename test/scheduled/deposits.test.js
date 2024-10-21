const DepositEvents = require('../../src/datasources/events/deposit-events');
const DepositsTask = require('../../src/scheduled/tasks/deposits');
const { allToBigInt } = require('../../src/utils/number');

describe('Deposits Task', () => {
  test('Identifies net deposit activity over block range', async () => {
    const events = require('../mock-responses/events/getSiloDepositEventsCollapsed.json');
    jest.spyOn(DepositEvents, 'getSiloDepositEventsCollapsed').mockResolvedValue(allToBigInt(events, ['type']));

    const netActivity = await DepositsTask.getNetChange(100, 200);

    expect(netActivity['abc|beantoken|-123456']).toEqual(4500000n);
    expect(netActivity['def|beantoken|10']).toEqual(-1600000n);
    expect(netActivity['ghi|urbean|-123456']).toBeUndefined();
  });
});
