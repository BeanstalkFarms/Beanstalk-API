const DepositDto = require('../../../subgraph/dto/DepositDto');

class DepositModelAssembler {
  static toModel(depositDto, tokenModels) {
    //
  }
  static fromModel(depositModel) {
    return DepositDto.fromModel(depositModel);
  }
}
module.exports = DepositModelAssembler;
