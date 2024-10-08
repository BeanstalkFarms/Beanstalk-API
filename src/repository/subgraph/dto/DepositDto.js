class DepositDto {
  static subgraphFields = `
    farmer {
      id
    }
    token
    stemV31
    depositedAmount
    depositedBDV
  `;

  constructor(subgraphDeposit) {
    this.account = subgraphDeposit.farmer.id;
    this.token = subgraphDeposit.token;
    this.stem = BigInt(subgraphDeposit.stemV31);
    this.amount = BigInt(subgraphDeposit.depositedAmount);
    this.bdv = BigInt(subgraphDeposit.depositedBDV);
  }
}

module.exports = DepositDto;
