const { C } = require('../../constants/runtime-constants');
const { isNil } = require('../../utils/bigint');

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

  id;
  chain = C().CHAIN;
  account;
  token;
  stem;
  mowStem;
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

  constructor(type, d) {
    if (type === 'sg') {
      this.account = d.farmer.id;
      this.token = d.token;
      this.stem = BigInt(d.stemV31);
      this.depositedAmount = BigInt(d.depositedAmount);
      this.depositedBdv = BigInt(d.depositedBDV);
    } else if (type === 'db') {
      this.id = d.id;
      this.account = d.account;
      this.token = d.Token.address;
      this.stem = d.stem;
      this.mowStem = d.mowStem;
      this.depositedAmount = d.depositedAmount;
      this.depositedBdv = d.depositedBdv;
      this.baseStalk = d.baseStalk;
      this.grownStalk = d.grownStalk;
      this.mowableStalk = d.mowableStalk;
      this.currentStalk = d.currentStalk;
      this.currentSeeds = d.currentSeeds;
      this.bdvOnLambda = d.bdvOnLambda;
      this.stalkOnLambda = d.stalkOnLambda;
      this.seedsOnLambda = d.seedsOnLambda;
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
    this.grownStalk = this.depositedBdv * (this.mowStem - this.stem);
    this.mowableStalk = this.depositedBdv * (tokenInfo.stemTip - this.mowStem);
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
    const grownStalkOnLambda = this.bdvOnLambda * (tokenInfo.stemTip - this.stem);
    this.stalkOnLambda = baseStalkOnLambda + grownStalkOnLambda;
  }
}

module.exports = DepositDto;
