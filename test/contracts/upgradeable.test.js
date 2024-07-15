const { providerThenable } = require('../../src/datasources/alchemy');
const Contracts = require('../../src/datasources/contracts/contracts');
const UpgradeableContract = require('../../src/datasources/contracts/upgradeable-contract');
const { priceMapping } = require('../../src/datasources/contracts/upgradeable-mappings');

describe('UpgradeableContract', () => {
  it('should call the correct contract address by block number', async () => {
    const spy = jest.spyOn(Contracts, 'makeContract');

    const provider = await providerThenable;
    const priceContract = new UpgradeableContract(priceMapping, provider);

    // Avoid invoking the external call, this is enough to create the proper contract
    priceContract.price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[1].address, priceMapping[1].abi, provider);

    priceContract[20000000].price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[0].address, priceMapping[0].abi, provider);

    priceContract[20298142].price;
    expect(spy).toHaveBeenLastCalledWith(priceMapping[1].address, priceMapping[1].abi, provider);

    expect(() => priceContract[15000000].price).toThrow();
  });
});
