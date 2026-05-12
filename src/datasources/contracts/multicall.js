const { C } = require('../../constants/runtime-constants');
const retryable = require('../../utils/async/retryable');
const SuperContract = require('./super-contract');
const Contracts = require('./contracts');

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'bool', name: 'allowFailure', type: 'bool' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'success', type: 'bool' },
          { internalType: 'bytes', name: 'returnData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

class Multicall {
  static async aggregate(calls, { blockTag = 'latest', c = C() } = {}) {
    if (calls.length === 0) {
      return [];
    }

    const results = new Array(calls.length);
    const callsByBlock = calls.reduce((acc, call, index) => {
      const callBlock = call.blockTag ?? blockTag;
      if (!acc.has(callBlock)) {
        acc.set(callBlock, []);
      }
      acc.get(callBlock).push({ call, index });
      return acc;
    }, new Map());

    await Promise.all(
      [...callsByBlock.entries()].map(async ([callBlock, entries]) => {
        const multicall = Contracts.makeContract(MULTICALL3_ADDRESS, MULTICALL3_ABI, c.RPC);
        const aggregateCalls = entries.map(({ call }) => ({
          target: call.contract.address,
          allowFailure: call.allowFailure ?? false,
          callData: call.contract.interface.encodeFunctionData(call.method, call.args ?? [])
        }));

        const aggregateResults = await retryable(() =>
          multicall.aggregate3({ target: 'SuperContract', skipTransform: true }, aggregateCalls, {
            blockTag: callBlock
          })
        );

        for (let i = 0; i < entries.length; ++i) {
          const { call, index } = entries[i];
          const result = aggregateResults[i];
          if (!result.success) {
            if (call.allowFailure) {
              results[index] = null;
              continue;
            }
            throw new Error(`Multicall failed for ${call.contract.address}.${call.method}`);
          }

          const fragment = call.contract.interface.getFunction(call.method);
          const decoded = call.contract.interface.decodeFunctionResult(fragment, result.returnData);
          results[index] = SuperContract._transformAll(fragment.outputs.length === 1 ? decoded[0] : decoded);
        }
      })
    );

    return results;
  }
}

module.exports = Multicall;
