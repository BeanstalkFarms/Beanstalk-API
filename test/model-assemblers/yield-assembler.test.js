const { BEAN, BEAN3CRV, BEANWETH, BEANWSTETH, UNRIPE_BEAN, UNRIPE_LP } = require('../../src/constants/addresses');
const YieldModelAssembler = require('../../src/repository/postgres/models/assemblers/yield-assembler');
const { ApyInitType } = require('../../src/repository/postgres/models/types/types');

describe('Yield Assembler', () => {
  test('Yield model transform - round trip', async () => {
    const yieldDto = require('./dtos/yield.json');
    const tokenIdMapping = [
      { id: 1, token: BEAN },
      { id: 2, token: BEAN3CRV },
      { id: 3, token: BEANWETH },
      { id: 4, token: BEANWSTETH },
      { id: 5, token: UNRIPE_BEAN },
      { id: 6, token: UNRIPE_LP }
    ];
    const models = YieldModelAssembler.toModels(yieldDto, ApyInitType.AVERAGE, tokenIdMapping);

    // Modify such that Token is present with the required info
    models.forEach((m) => {
      m.Token = {
        token: tokenIdMapping.find((t) => t.id === m.tokenId).token
      };
    });

    const dto = YieldModelAssembler.fromModels(models);
  });
});
