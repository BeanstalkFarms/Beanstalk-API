const { providerThenable } = require("../datasources/alchemy");
const SubgraphClient = require("../datasources/subgraph-client");
const { slugSG, SLUGS } = require("../datasources/subgraph-client");

class SubgraphService {

  static async getStatus(environments) {

    const retval = { fatalErrors: [] };

    // Get deployment hash corresponding to the subgraph name
    const metaPromises = [];
    for (const slug of SLUGS) {
      metaPromises.push(
        slugSG(slug)(SubgraphClient.gql`
          {
            _meta {
              deployment
            }
          }`
      ));
    }

    const metas = await Promise.allSettled(metaPromises);
    const deploymentToName = {};
    for (let i = 0; i < metas.length; ++i) {
      // Rejected promise will occur when the subgraph does not exist
      if (metas[i].status === 'fulfilled') {
        retval[SLUGS[i]] = { deployment: metas[i].value._meta.deployment };
        deploymentToName[metas[i].value._meta.deployment] = SLUGS[i];
      } else {
        const errorMessage = metas[i].reason.response.errors[0].message;
        retval[SLUGS[i]] = { error: errorMessage };
        // Consider an undeployed subgraph `healthy`
        retval[SLUGS[i]].healthy = errorMessage !== 'indexing_error';
      }
    }

    // Get more detailed information about all subgraphs, which can be matched against the deployment identified above
    const allStatuses = await SubgraphClient.statusGql(SubgraphClient.gql`
      {
        indexingStatuses {
          subgraph
          synced
          health
          fatalError {
            message
          }
          chains {
            chainHeadBlock {
              number
            }
            earliestBlock {
              number
            }
            latestBlock {
              number
            }
          }
        }
      }`
    );

    const currentBlock = (await (await providerThenable).getBlock()).number;

    for (const status of allStatuses.indexingStatuses) {
      const name = deploymentToName[status.subgraph];
      if (name) {
        retval[name].synced = status.synced;
        retval[name].healthy = status.health === 'healthy';

        // Block information
        retval[name].indexedBlock = parseInt(status.chains[0].latestBlock.number);
        const totalBlocks = currentBlock - status.chains[0].earliestBlock.number;
        const blocksIndexed = status.chains[0].latestBlock.number - status.chains[0].earliestBlock.number;
        retval[name].blocksBehind = totalBlocks - blocksIndexed;
        retval[name].progress = parseFloat((blocksIndexed / totalBlocks).toFixed(4));
        retval[name].chainHeadBlockLag = currentBlock - status.chains[0].chainHeadBlock.number;
      } else if (status.fatalError?.message) {
        retval.fatalErrors.push({
          deployment: status.subgraph,
          message: status.fatalError?.message
        });
      }
    }

    return retval;
  }
}

module.exports = SubgraphService;
