const { ethers } = require('ethers');

jest.mock('../../src/datasources/contracts/contracts', () => ({
  makeContract: jest.fn()
}));

const Contracts = require('../../src/datasources/contracts/contracts');
const Multicall = require('../../src/datasources/contracts/multicall');

describe('Multicall', () => {
  beforeEach(() => {
    Contracts.makeContract.mockReset();
  });

  test('decodes aggregate3 responses in request order', async () => {
    const tokenInterface = new ethers.Interface(['function balanceOf(address account) view returns (uint256)']);
    const token = {
      address: '0x0000000000000000000000000000000000000001',
      interface: tokenInterface
    };
    const multicall = {
      aggregate3: jest.fn().mockResolvedValue([
        {
          success: true,
          returnData: tokenInterface.encodeFunctionResult('balanceOf', [123n])
        }
      ])
    };
    Contracts.makeContract.mockReturnValue(multicall);

    const results = await Multicall.aggregate([
      {
        contract: token,
        method: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000002'],
        blockTag: 100
      }
    ]);

    expect(multicall.aggregate3).toHaveBeenCalledWith(
      { target: 'SuperContract', skipTransform: true },
      [
        {
          target: token.address,
          allowFailure: false,
          callData: tokenInterface.encodeFunctionData('balanceOf', ['0x0000000000000000000000000000000000000002'])
        }
      ],
      { blockTag: 100 }
    );
    expect(results).toEqual([123n]);
  });

  test('returns null for allowed failed calls', async () => {
    const tokenInterface = new ethers.Interface(['function symbol() view returns (string)']);
    const multicall = {
      aggregate3: jest.fn().mockResolvedValue([{ success: false, returnData: '0x' }])
    };
    Contracts.makeContract.mockReturnValue(multicall);

    const results = await Multicall.aggregate([
      {
        contract: {
          address: '0x0000000000000000000000000000000000000001',
          interface: tokenInterface
        },
        method: 'symbol',
        allowFailure: true
      }
    ]);

    expect(results).toEqual([null]);
  });
});
