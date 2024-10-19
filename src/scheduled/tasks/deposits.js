class DepositsTask {
  static async updateDeposits() {
    // Determine range of blocks to update on
    const currentBlock = (await C().RPC.getBlock()).number;

    // const prevUpdateBlock =

    // Buffer to avoid issues with a chain reorg.
    // This could be reduced further but is sufficient for now.
    const updateBlock = currentBlock - 10; // TODO: function to determine how many blocks per second
    // meta block + 1
  }

  // Updates the list of deposits in the database, adding/removing entries as needed
  static async updateDepositsList() {
    // Get a list of added and removed deposits
    // Pull corresponding db entries
    // Increase/decrease deposited amounts, delete entry if needed
  }

  // Updates lambda bdv stats as appropriate. Can optionally force an update for all entries.
  static async updateLambdaStats(forced = false) {
    // Check whether bdv of a token has meaningfully updated since the last update
    // If so, pull all corresponding deposits from db and update their lambda stats
  }
}
module.exports = DepositsTask;
