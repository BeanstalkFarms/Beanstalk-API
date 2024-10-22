const AlchemyUtil = require('../alchemy');
const FilterLogs = require('./filter-logs');

const DEPOSIT_EVENTS = ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits'];

class DepositEvents {
  // Returns a summary of add/remove deposit events. Collapses RemoveDeposits out of its array form
  static async getSiloDepositEvents(fromBlock, toBlock = 'latest') {
    const rawEvents = await FilterLogs.getBeanstalkEvents(DEPOSIT_EVENTS, fromBlock, toBlock);
    const collapsed = [];
    for (const event of rawEvents) {
      if (event.name === 'RemoveDeposits') {
        for (let i = 0; i < event.args.stems.length; ++i) {
          collapsed.push({
            type: -1,
            account: event.args.account.toLowerCase(),
            token: event.args.token.toLowerCase(),
            stem: BigInt(event.args.stems[i]),
            amount: BigInt(event.args.amounts[i]),
            bdv: BigInt(event.args.bdvs[i])
          });
        }
      } else {
        collapsed.push({
          type: event.name === 'AddDeposit' ? 1 : -1,
          account: event.args.account.toLowerCase(),
          token: event.args.token.toLowerCase(),
          stem: BigInt(event.args.stem),
          amount: BigInt(event.args.amount),
          bdv: BigInt(event.args.bdv)
        });
      }
    }
    return collapsed;
  }

  // Returns condensed info from StalkBalanceChanged
  static async getStalkBalanceChangedEvents(fromBlock, toBlock = 'latest') {
    const rawEvents = await FilterLogs.getBeanstalkEvents(['StalkBalanceChanged'], fromBlock, toBlock);
    const summary = [];
    for (const event of rawEvents) {
      summary.push({
        account: event.args.account.toLowerCase(),
        deltaStalk: BigInt(event.args.delta),
        blockNumber: event.rawLog.blockNumber
      });
    }
    return summary;
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
    // console.log(await DepositEvents.getSiloDepositEvents(264547404));
    console.log(await DepositEvents.getStalkBalanceChangedEvents(264547404));
  })();
}
