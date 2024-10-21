const AlchemyUtil = require('../alchemy');
const FilterLogs = require('./filter-logs');

const DEPOSIT_EVENTS = ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits'];

class DepositEvents {
  static async getSiloDepositEvents(fromBlock, toBlock = 'latest') {
    return await FilterLogs.getBeanstalkEvents(DEPOSIT_EVENTS, fromBlock, toBlock);
  }

  // Collapses RemoveDeposits out of its array form
  static async getSiloDepositEventsCollapsed(fromBlock, toBlock = 'latest') {
    const allEvents = await DepositEvents.getSiloDepositEvents(fromBlock, toBlock);
    const collapsed = [];
    for (const event of allEvents) {
      if (event.name === 'RemoveDeposits') {
        for (let i = 0; i < event.args.stems.length; ++i) {
          collapsed.push({
            type: -1,
            account: event.args.account,
            token: event.args.token,
            stem: BigInt(event.args.stems[i]),
            amount: BigInt(event.args.amounts[i]),
            bdv: BigInt(event.args.bdvs[i])
          });
        }
      } else {
        collapsed.push({
          type: event.name === 'AddDeposit' ? 1 : -1,
          account: event.args.account,
          token: event.args.token,
          stem: BigInt(event.args.stem),
          amount: BigInt(event.args.amount),
          bdv: BigInt(event.args.bdv)
        });
      }
    }
    return collapsed;
  }
}
module.exports = DepositEvents;

if (require.main === module) {
  (async () => {
    await AlchemyUtil.ready('arb');
    // const logs = await DepositEvents.getSiloDepositEvents(264547404);
    // console.log(logs.filter((l) => l.name === 'AddDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposits')[0].args.stems);
    console.log(await DepositEvents.getSiloDepositEventsCollapsed(264547404));
  })();
}
