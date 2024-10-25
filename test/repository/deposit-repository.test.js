const { Sequelize } = require('../../src/repository/postgres/models');
const DepositRepository = require('../../src/repository/postgres/queries/deposit-repository');

describe('Deposit repository', () => {
  describe('Where construction', () => {
    test('Adds criteria', () => {
      const where = DepositRepository._constructFindWhere([{ a: 'b', c: 'd' }, { e: 'f' }], null);
      expect(where[Sequelize.Op.and]).toEqual([{ [Sequelize.Op.or]: [{ a: 'b', c: 'd' }, { e: 'f' }] }]);
    });
    test('Token association substitution', () => {
      const where = DepositRepository._constructFindWhere([{ token: 'b' }, { e: 'f' }], null);
      expect(where[Sequelize.Op.and]).toEqual([{ [Sequelize.Op.or]: [{ '$Token.address$': 'b' }, { e: 'f' }] }]);
    });
    test('Lambda bdv difference sorting', () => {
      const where = DepositRepository._constructFindWhere(null, 'increasing');
      expect(where[Sequelize.Op.and]).toEqual([Sequelize.literal(`"bdvOnLambda" - "depositedBdv" > 0`)]);

      const where2 = DepositRepository._constructFindWhere(null, 'decreasing');
      expect(where2[Sequelize.Op.and]).toEqual([Sequelize.literal(`"bdvOnLambda" - "depositedBdv" < 0`)]);
    });
    test('Empty where', () => {
      const where = DepositRepository._constructFindWhere();
      expect(where).toEqual({});
    });
    test('All together', () => {
      const where = DepositRepository._constructFindWhere([{ token: 'b' }, { e: 'f' }], 'increasing');
      expect(where[Sequelize.Op.and].length).toBe(2);
      expect(where[Sequelize.Op.and][0]).toEqual({ [Sequelize.Op.or]: [{ '$Token.address$': 'b' }, { e: 'f' }] });
      expect(where[Sequelize.Op.and][1]).toEqual(Sequelize.literal(`"bdvOnLambda" - "depositedBdv" > 0`));
    });
  });
  test('Sort', () => {
    const literalSpy = jest.spyOn(Sequelize, 'literal');
    const sort = {
      field: 'bdv',
      type: 'absolute'
    };
    DepositRepository._constructFindSort(sort);

    expect(literalSpy).toHaveBeenCalledWith('ABS("bdvOnLambda" - "depositedBdv")');

    sort.field = 'token';
    expect(() => DepositRepository._constructFindSort(sort)).toThrow();
  });
});
