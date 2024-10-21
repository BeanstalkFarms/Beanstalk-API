const { C } = require('../../constants/runtime-constants');
const DepositEvents = require('../../datasources/events/deposit-events');
const MetaRepository = require('../../repository/postgres/queries/meta-repository');
const DepositService = require('../../service/deposit-service');
const AsyncContext = require('../../utils/async/context');

const DEFAULT_UPDATE_THRESHOLD = 0.01;
const HOURLY_UPDATE_THRESHOLD = 0.005;

class DepositsTask {
  static async updateDeposits() {
    const isHourly = new Date().getMinutes() === 0;

    // Determine range of blocks to update on
    const prevUpdateBlock = (await MetaRepository.get(C().CHAIN)).lastDepositUpdate;
    const currentBlock = (await C().RPC.getBlock()).number;
    // Buffer to avoid issues with a chain reorg
    const updateBlock = currentBlock - 10; // TODO: function to determine how many blocks per second

    await AsyncContext.sequelizeTransaction(async () => {
      await DepositsTask.updateDepositsList(prevUpdateBlock + 1, updateBlock);
      // TODO: if isHourly, need to update the seed count associated with every deposit
      await MetaRepository.update(C().CHAIN, {
        lastDepositUpdate: updateBlock
      });
    });

    await AsyncContext.sequelizeTransaction(async () => {
      // Uses a looser update threshold once per hour
      await DepositsTask.updateLambdaStats(isHourly ? HOURLY_UPDATE_THRESHOLD : DEFAULT_UPDATE_THRESHOLD);
    });
  }

  // Updates the list of deposits in the database, adding/removing entries as needed
  static async updateDepositsList(fromBlock, toBlock) {
    const netActivity = await DepositsTask.getNetChange(fromBlock, toBlock);

    // Pull corresponding db entries
    const depositsToRetrieve = [];
    for (const key in netActivity) {
      const elem = key.split('|');
      depositsToRetrieve.push({
        chain: C().CHAIN,
        account: elem[0],
        token: elem[1],
        stem: BigInt(elem[2])
      });
    }
    const deposits = await DepositService.getMatchingDeposits(depositsToRetrieve);

    const tokenInfos = await SiloService.getWhitelistedTokenInfo({ block: seedBlock, chain: C().CHAIN });
    const { toUpsert, toDelete } = DepositsTask.updateCurrentDepositValues(deposits, netActivity, tokenInfos);

    if (toDelete.length > 0) {
      await DepositService.removeDeposits(toDelete);
    }

    // Update lambda stats on the updateable deposits
    if (toUpsert.length > 0) {
      await DepositService.batchUpdateLambdaBdvs(toUpsert, tokenInfos, updateBlock);
      await DepositService.updateDeposits(toUpsert);
    }
  }

  // Updates lambda bdv stats if the bdv of an asset has changed by more than `updateThreshold` since the last update.
  static async updateLambdaStats(updateThreshold) {
    // Check whether bdv of a token has meaningfully updated since the last update
    // If so, pull all corresponding deposits from db and update their lambda stats
  }

  // Gets the set of net deposit activity over this range in token amounts
  static async getNetChange(fromBlock, toBlock) {
    const newEvents = await DepositEvents.getSiloDepositEventsCollapsed(fromBlock, toBlock);
    const netActivity = {};
    for (const event of newEvents) {
      const key = `${event.account}|${event.token}|${event.stem}`;
      netActivity[key] ||= {
        amount: 0n,
        bdv: 0n
      };
      netActivity[key].amount += BigInt(event.type) * event.amount;
      netActivity[key].bdv += BigInt(event.type) * event.bdv;
    }

    // Filter 0 entries (no net activity)
    for (const key in netActivity) {
      if (netActivity[key].amount === 0n) {
        delete netActivity[key];
      }
    }
    return netActivity;
  }

  // Increase/decrease deposited amounts. Identifies which deposits should be deleted or upserted
  static updateCurrentDepositValues(deposits, netActivity, tokenInfos) {
    const toUpsert = [];
    const toDelete = [];
    for (const deposit of deposits) {
      const key = `${deposit.account}|${deposit.token}|${deposit.stem}`;
      deposit.depositedAmount += netActivity[key].amount;
      if (deposit.depositedAmount === 0n) {
        toDelete.push(deposit);
      } else {
        deposit.depositedBdv += netActivity[key].bdv;
        deposit.setStalkAndSeeds(tokenInfos[deposit.token]);
        toUpsert.push(deposit);
      }
    }
    return { toUpsert, toDelete };
  }
}
module.exports = DepositsTask;
