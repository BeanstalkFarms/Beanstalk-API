const DefaultGaugePointFunction = require('../../src/service/utils/apy/gp-functions/default');
const LegacyDefaultGaugePointFunction = require('../../src/service/utils/apy/gp-functions/legacy');

describe('Gauge Point Functions', () => {
  test('Current default implementation', () => {
    const f = DefaultGaugePointFunction.next;
    expect(f(1000, 80, 1.87)).toEqual(1000);
    expect(f(1000, 80, 98.13)).toEqual(995);
    expect(f(1000, 80, 90.13)).toEqual(997);
    expect(f(1000, 80, 82.13)).toEqual(999);
    expect(f(500, 20, 5)).toEqual(505);
    expect(f(500, 20, 10)).toEqual(503);
    expect(f(500, 20, 15)).toEqual(501);
    expect(f(500, 20, 21)).toEqual(499);
    expect(f(500, 20, 19)).toEqual(501);
    expect(f(500, 20, 20)).toEqual(500);
  });
  test('BIP45 implementation', () => {
    const f = LegacyDefaultGaugePointFunction.next;
    expect(f(1000, 80, 1.87)).toEqual(1000);
    expect(f(1000, 80, 98.13)).toEqual(999);
    expect(f(500, 20, 21)).toEqual(499);
    expect(f(500, 20, 19)).toEqual(501);
    expect(f(500, 20, 20)).toEqual(500);
  });
});
