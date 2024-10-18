const { C } = require('../../../constants/runtime-constants');
const { isNil } = require('../../../utils/bigint');

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

  chain = C().CHAIN;
  account;
  token;
  stem;
  depositedAmount;
  depositedBdv;
  baseStalk;
  grownStalk;
  mowableStalk;
  currentStalk;
  currentSeeds;
  bdvOnLambda;
  stalkOnLambda;
  seedsOnLambda;

  constructor(type, subgraphDeposit) {
    if (type === 'sg') {
      this.account = subgraphDeposit.farmer.id;
      this.token = subgraphDeposit.token;
      this.stem = BigInt(subgraphDeposit.stemV31);
      this.depositedAmount = BigInt(subgraphDeposit.depositedAmount);
      this.depositedBdv = BigInt(subgraphDeposit.depositedBDV);
    } else if (type === 'db') {
      // TODO
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

  setStalkAndSeeds(tokenInfo) {
    if (isNil(this.depositedBdv) || isNil(this.stem) || isNil(this.mowStem) || !tokenInfo) {
      throw new Error('DepositDto missing required fields for setStalkAndSeeds');
    }
    this.baseStalk = this.depositedBdv * tokenInfo.stalkIssuedPerBdv;
    this.grownStalk = this.depositedBdv * ((this.mowStem - this.stem) * BigInt(10 ** 6));
    this.mowableStalk = this.depositedBdv * ((tokenInfo.stemTip - this.mowStem) * BigInt(10 ** 6));
    this.currentStalk = this.baseStalk + this.grownStalk;
    this.currentSeeds = this.depositedBdv * tokenInfo.stalkEarnedPerSeason;
  }

  // bdvOnLambda should be provided by calling bdvs function on this.depositedAmount.
  // It is done external to this method so it can be batched with other deposit's requests.
  updateLambdaStats(bdvOnLambda, tokenInfo) {
    if (isNil(bdvOnLambda) || !tokenInfo) {
      throw new Error('DepositDto missing required fields for updateLambdaStats');
    }
    this.bdvOnLambda = bdvOnLambda;
    this.seedsOnLambda = this.bdvOnLambda * tokenInfo.stalkEarnedPerSeason;

    // Includes the effect of a mow
    const baseStalkOnLambda = this.bdvOnLambda * tokenInfo.stalkIssuedPerBdv;
    const grownStalkOnLambda = this.bdvOnLambda * ((tokenInfo.stemTip - this.stem) * BigInt(10 ** 6));
    this.stalkOnLambda = baseStalkOnLambda + grownStalkOnLambda;
  }
}

module.exports = DepositDto;
