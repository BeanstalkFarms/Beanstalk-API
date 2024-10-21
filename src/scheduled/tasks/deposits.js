const { C } = require('../../constants/runtime-constants');
const DepositEvents = require('../../datasources/events/deposit-events');
const MetaRepository = require('../../repository/postgres/queries/meta-repository');
const DepositService = require('../../service/deposit-service');

const DEFAULT_UPDATE_THRESHOLD = 0.01;
const HOURLY_UPDATE_THRESHOLD = 0.005;

class DepositsTask {
  static async updateDeposits() {
    // Determine range of blocks to update on
    const prevUpdateBlock = (await MetaRepository.get(C().CHAIN)).lastDepositUpdate;
    const currentBlock = (await C().RPC.getBlock()).number;
    // Buffer to avoid issues with a chain reorg
    const updateBlock = currentBlock - 10; // TODO: function to determine how many blocks per second

    await DepositsTask.updateDepositsList(prevUpdateBlock + 1, updateBlock);

    // Uses a looser update threshold once per hour
    const hourly = new Date().getMinutes() === 0;
    await DepositsTask.updateLambdaStats(hourly ? HOURLY_UPDATE_THRESHOLD : DEFAULT_UPDATE_THRESHOLD);
  }

  // Updates the list of deposits in the database, adding/removing entries as needed
  static async updateDepositsList(fromBlock, toBlock) {
    // Gets the set of net deposit activity over this range in token amounts
    const newEvents = await DepositEvents.getSiloDepositEventsCollapsed(fromBlock, toBlock);
    const netActivity = {};
    for (const event of newEvents) {
      const key = `${event.account}-${event.token}-${event.stem}`;
      netActivity[key] = (netActivity[key] ?? 0n) + BigInt(event.type) * event.amount;
    }

    // Filter 0 entries (no net activity)
    const depositsToRetrieve = [];
    for (const key in netActivity) {
      if (netActivity[key] !== 0n) {
        const elem = key.split('-');
        depositsToRetrieve.push({
          chain: C().CHAIN,
          account: elem[0],
          token: elem[1],
          stem: BigInt(elem[2])
        });
      }
    }

    // Pull corresponding db entries
    const deposits = await DepositService.getMatchingDeposits(depositsToRetrieve);

    // Increase/decrease deposited amounts, delete entry if needed
  }

  // Updates lambda bdv stats if the bdv of an asset has changed by more than `updateThreshold` since the last update.
  static async updateLambdaStats(updateThreshold) {
    // Check whether bdv of a token has meaningfully updated since the last update
    // If so, pull all corresponding deposits from db and update their lambda stats
  }
}
module.exports = DepositsTask;
