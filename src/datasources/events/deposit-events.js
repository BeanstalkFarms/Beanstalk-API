const { C } = require('../../constants/runtime-constants');
const AlchemyUtil = require('../alchemy');
const Contracts = require('../contracts/contracts');

////
const iBeanstalk = Contracts.getBeanstalk().interface;

const EVENT_NAMES = ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits'];
const TOPICS = EVENT_NAMES.map((n) => iBeanstalk.getEventTopic(n));
////
console.log(TOPICS);

class DepositEvents {
  static async getAllSiloDepositEvents(fromBlock, toBlock = 'latest') {
    //
    const filter = {
      address: C().BEANSTALK,
      topics: [TOPICS],
      fromBlock,
      toBlock
    };

    const logs = await C().RPC.getLogs(filter);
    const events = logs.map((log) => iBeanstalk.parseLog(log));
    return events;
  }

  // Collapses RemoveDeposits out of its array form
  static async getAllDepositEventsCollapsed(fromBlock, toBlock = 'latest') {
    const allEvents = await DepositEvents.getAllSiloDepositEvents(fromBlock, toBlock);
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
    // const logs = await DepositEvents.getAllSiloDepositEvents(264547404);
    // console.log(logs.filter((l) => l.name === 'AddDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposits')[0].args.stems);
    // console.log(await DepositEvents.getAllDepositEventsCollapsed(264547404));
  })();
}
