const { C } = require('../../src/constants/runtime-constants');
const Contracts = require('../../src/datasources/contracts/contracts');
const UpgradeableContract = require('../../src/datasources/contracts/upgradeable-contract');

const priceMapping = [
  {
    chain: 'eth',
    start: 17978222,
    end: 20298142,
    address: '0xb01CE0008CaD90104651d6A84b6B11e182a9B62A',
    abi: 'abi a'
  },
  {
    chain: 'eth',
    start: 20298142,
    end: 'latest',
    address: '0x4bed6cb142b7d474242d87f4796387deb9e1e1b4',
    abi: 'abi b'
  },
  {
    chain: 'arb',
    start: 202981420,
    end: 'latest',
    address: '0xc218f5a782b0913931dcf502fa2aa959b36ac9e7',
    abi: 'abi c'
  }
];

describe('UpgradeableContract', () => {
  it('should call the correct contract address by block number', () => {
    const spy = jest.spyOn(Contracts, 'makeContract').mockResolvedValue(null);

    const priceContract = new UpgradeableContract(priceMapping, C('eth'), 'latest');
    expect(priceContract.__version()).toBe(2);

    // Avoid invoking the external call, this is enough to create the proper contract
    priceContract.price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[1].address, priceMapping[1].abi, C('eth').RPC);

    priceContract[20000000].price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[0].address, priceMapping[0].abi, C('eth').RPC);

    priceContract[20298142].price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[1].address, priceMapping[1].abi, C('eth').RPC);

    expect(() => priceContract[15000000].price).toThrow();
  });

  it('should select contract according to chain', () => {
    const spy = jest.spyOn(Contracts, 'makeContract').mockResolvedValue(null);
    const priceContract = new UpgradeableContract(priceMapping, C('arb'), 'latest');
    expect(priceContract.__version()).toBe(3);

    priceContract.price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[2].address, priceMapping[2].abi, C('arb').RPC);

    expect(() => priceContract[20398142].price).toThrow();
  });
});
