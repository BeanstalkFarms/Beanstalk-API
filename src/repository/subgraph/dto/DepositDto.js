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

  constructor(type, subgraphDeposit) {
    if (type === 'sg') {
      this.account = subgraphDeposit.farmer.id;
      this.token = subgraphDeposit.token;
      this.stem = BigInt(subgraphDeposit.stemV31);
      this.amount = BigInt(subgraphDeposit.depositedAmount);
      this.bdv = BigInt(subgraphDeposit.depositedBDV);
    } else if (type === 'db') {
      //
    } else {
      throw new Error(`Invalid constructor type '${type}'.`);
    }
  }

  static fromSubgraph(subgraphDeposit) {
    return new DepositDto('sg', subgraphDeposit);
  }

  static fromModel(dbModel) {
    return new DepositDto('db', dbModel);
  }
}

module.exports = DepositDto;
