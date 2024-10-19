class DepositsTask {
  // Updates the
  static async updateDeposits() {
    //
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
