const DepositDto = require('../../../dto/DepositDto');

class DepositModelAssembler {
  static toModel(depositDto, tokenModels) {
    return {
      chain: depositDto.chain,
      account: depositDto.account,
      tokenId: tokenModels.find((t) => t.address.toLowerCase() === depositDto.token).id,
      stem: depositDto.stem,
      mowStem: depositDto.mowStem,
      depositedAmount: depositDto.depositedAmount,
      depositedBdv: depositDto.depositedBdv,
      baseStalk: depositDto.baseStalk,
      grownStalk: depositDto.grownStalk,
      mowableStalk: depositDto.mowableStalk,
      currentStalk: depositDto.currentStalk,
      currentSeeds: depositDto.currentSeeds,
      bdvOnLambda: depositDto.bdvOnLambda,
      stalkOnLambda: depositDto.stalkOnLambda,
      seedsOnLambda: depositDto.seedsOnLambda
    };
  }
  static fromModel(depositModel) {
    return DepositDto.fromModel(depositModel);
  }
}
module.exports = DepositModelAssembler;
