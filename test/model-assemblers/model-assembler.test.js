const {
  ADDRESSES: { BEAN, BEAN3CRV, BEANWETH, BEANWSTETH, UNRIPE_BEAN, UNRIPE_LP }
} = require('../../src/constants/raw/beanstalk-eth');
const YieldModelAssembler = require('../../src/repository/postgres/models/assemblers/yield-assembler');
const { ApyInitType } = require('../../src/repository/postgres/models/types/types');
const SiloApyService = require('../../src/service/silo-apy');

describe('Model Assemblers', () => {
  describe('Yields', () => {
    test('Model transform - round trip', () => {
      const yieldDto = require('./dtos/yield.json');
      const tokenIdMapping = [
        { id: 1, address: BEAN },
        { id: 2, address: BEAN3CRV },
        { id: 3, address: BEANWETH },
        { id: 4, address: BEANWSTETH },
        { id: 5, address: UNRIPE_BEAN },
        { id: 6, address: UNRIPE_LP }
      ];
      const models = YieldModelAssembler.toModels(
        yieldDto,
        SiloApyService.DEFAULT_WINDOWS,
        ApyInitType.AVERAGE,
        tokenIdMapping
      );

      // Modify such that Token is present with the required info
      models.forEach((m) => {
        m.Token = {
          address: tokenIdMapping.find((t) => t.id === m.tokenId).address
        };
      });

      const dto = YieldModelAssembler.fromModels(models);
      expect(dto.ema[24].effectiveWindow).toBe(24);
      expect(dto.ema[168].effectiveWindow).toBe(168);
      expect(dto.ema[720].effectiveWindow).toBe(720);
    });

    test('Uses available windows when less is provided', () => {
      const earlyYieldsDto = require('./dtos/yieldEarly.json');
      const tokenIdMapping = [
        { id: 1, address: BEAN },
        { id: 2, address: BEAN3CRV },
        { id: 3, address: BEANWETH },
        { id: 4, address: BEANWSTETH },
        { id: 5, address: UNRIPE_BEAN },
        { id: 6, address: UNRIPE_LP }
      ];
      const models = YieldModelAssembler.toModels(
        earlyYieldsDto,
        SiloApyService.DEFAULT_WINDOWS,
        ApyInitType.AVERAGE,
        tokenIdMapping
      );

      expect(Object.keys(earlyYieldsDto.yields).length).toBe(2);
      expect(models.length).toBe(3 * 6);
      expect(models[0].emaEffectiveWindow).toBe(24);
      expect(models[6].emaEffectiveWindow).toBe(150);
      expect(models[12].emaEffectiveWindow).toBe(150);

      // Modify such that Token is present with the required info
      models.forEach((m) => {
        m.Token = {
          address: tokenIdMapping.find((t) => t.id === m.tokenId).address
        };
      });

      const dto = YieldModelAssembler.fromModels(models);
      expect(dto.ema[24].effectiveWindow).toBe(24);
      expect(dto.ema[168].effectiveWindow).toBe(150);
      expect(dto.ema[720].effectiveWindow).toBe(150);
    });
  });
});
