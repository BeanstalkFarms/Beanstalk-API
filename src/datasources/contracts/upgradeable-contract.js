const Contracts = require('./contracts');

// Orchestration layer for managing contracts that change over time. Supports upgrading existing
// contracts with new ABIs or switching to use a new contract address.
class UpgradeableContract {
  /**
   *
   * @param {*} mapping - used to determine which contract/abi to invoke per specified block
   * @param {*} provider - rpc provider to use
   * @param {*} defaultBlock - the default block to use
   * @returns
   */
  constructor(mapping, provider, defaultBlock = 'latest') {
    this.__defaultBlock = defaultBlock;
    this.__mapping = mapping;

    const proxyHandler = {
      get: (target, property, receiver) => {
        if (property === 'then') {
          return undefined;
        }
        if (property === 'callStatic') {
          // Allows legacy invocations to not require being updated to remove callStatic property
          return receiver;
        }
        if (['__mapping', '__defaultBlock', '__version'].includes(property)) {
          // Don't proxy explicitly defined members on this class
          return target[property];
        }

        if (!target.__block) {
          // A block has not been selected yet
          const isLeadingNumeric = property.charCodeAt(0) >= 48 && property.charCodeAt(0) <= 57;
          if (isLeadingNumeric) {
            // Need to receive an additional property
            return new Proxy({ __block: parseInt(property) }, proxyHandler);
          }
        }

        const block = target.__block ?? this.__defaultBlock;

        // Find the contract corresponding to the input block
        const selected = mapping.find((entry) => {
          if (block === 'latest') {
            return entry.end === 'latest';
          } else {
            return block >= entry.start && (entry.end === 'latest' || block < entry.end);
          }
        });

        if (!selected) {
          throw new Error(`Block ${block} is not supported by the provided mapping.`);
        }

        // Return the requested function with block prefilled
        const contract = Contracts.makeContract(selected.address, selected.abi, provider);
        return (...args) => contract.callStatic[property](...args, { blockTag: block });
      }
    };

    return new Proxy(this, proxyHandler);
  }

  // Returns a version number for this contract at the requested block
  __version(block = this.__defaultBlock) {
    for (let i = 0; i < this.__mapping.length; ++i) {
      if (this.__mapping[i].start <= block && (this.__mapping[i].end > block || this.__mapping[i].end === 'latest')) {
        return i + 1;
      }
    }
    return -1;
  }
}

module.exports = UpgradeableContract;
