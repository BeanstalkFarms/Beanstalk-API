const { BEAN, BEAN3CRV, BEANWETH, BEANWSTETH, UNRIPE_BEAN, UNRIPE_LP } = require('../../src/constants/addresses');
const YieldModelAssembler = require('../../src/repository/postgres/models/assemblers/yield-assembler');
const { ApyInitType } = require('../../src/repository/postgres/models/types/types');

describe('Model Assemblers', () => {
  test('Yield model transform - round trip', async () => {
    const yieldDto = require('./dtos/yield.json');
    const tokenIdMapping = [
      { id: 1, address: BEAN },
      { id: 2, address: BEAN3CRV },
      { id: 3, address: BEANWETH },
      { id: 4, address: BEANWSTETH },
      { id: 5, address: UNRIPE_BEAN },
      { id: 6, address: UNRIPE_LP }
    ];
    const models = YieldModelAssembler.toModels(yieldDto, ApyInitType.AVERAGE, tokenIdMapping);

    // Modify such that Token is present with the required info
    models.forEach((m) => {
      m.Token = {
        address: tokenIdMapping.find((t) => t.id === m.tokenId).address
      };
    });

    const dto = YieldModelAssembler.fromModels(models);
  });
});
