const { providerThenable } = require('../datasources/alchemy');
const SubgraphClient = require('../datasources/subgraph-client');
const { slugSG, slugStatus, SLUGS } = require('../datasources/subgraph-client');
const CommonSubgraphRepository = require('../repository/subgraph/common-subgraph');

// For retrieving current statuses of our subgraphs.
class SubgraphService {
  static async getStatuses(environments) {
    let deploymentStatuses = {};

    if (environments.indexOf('decentralized') >= 0) {
      environments.splice(environments.indexOf('decentralized'), 1);
      deploymentStatuses = await this.getDecentralizedStatuses();
    }

    if (environments.length == 0) {
      return deploymentStatuses;
    }

    deploymentStatuses.allFatalErrors = [];

    // Get deployment hash corresponding to the subgraph name
    const metaPromises = [];
    const names = [];
    for (const env of environments) {
      for (const slug of SLUGS) {
        const name = slug + suffixForEnv(env);
        names.push(name);
        metaPromises.push(CommonSubgraphRepository.getMeta(slugSG(name)));
      }
    }

    const metas = await Promise.allSettled(metaPromises);

    const deploymentToName = {};
    for (let i = 0; i < metas.length; ++i) {
      // Rejected promise will occur when the subgraph does not exist
      if (metas[i].status === 'fulfilled') {
        deploymentStatuses[names[i]] = { deployment: metas[i].value.deployment };
        deploymentToName[metas[i].value.deployment] = names[i];
      } else {
        const errorMessage = metas[i].reason?.response?.errors?.[0]?.message || 'failed to obtain meta';
        deploymentStatuses[names[i]] = { error: errorMessage };
        // Consider an undeployed subgraph `healthy`
        deploymentStatuses[names[i]].healthy = errorMessage !== 'indexing_error';
      }
    }

    // Get more detailed information about all subgraphs, which can be matched against the deployment identified above
    const statusPromises = [];
    for (const name of names) {
      statusPromises.push(CommonSubgraphRepository.getAlchemyStatus(slugStatus(name)));
    }
    const statuses = await Promise.allSettled(statusPromises);
    const allStatuses = [];
    for (let i = 0; i < statuses.length; ++i) {
      // Rejected promise will occur when the subgraph does not exist
      if (statuses[i].status === 'fulfilled') {
        allStatuses.push(statuses[i].value);
      }
    }

    const currentBlock = (await (await providerThenable).getBlock()).number;

    for (const status of allStatuses) {
      const deployedNames = namesForDeployment(deploymentStatuses, status.subgraph).filter(
        (n) => !n.startsWith('graph-')
      );
      for (const name of deployedNames) {
        deploymentStatuses[name].synced = status.synced;
        deploymentStatuses[name].healthy = status.health === 'healthy';

        // Block information
        deploymentStatuses[name].indexedBlock = parseInt(status.chains[0].latestBlock.number);
        deploymentStatuses[name].blocksBehind = currentBlock - status.chains[0].latestBlock.number;
        deploymentStatuses[name].chainHeadBlockLag = currentBlock - status.chains[0].chainHeadBlock.number;
      }

      // Keep a list of all fatal errors, though not correlated to a particular subgraph
      if (status.fatalError?.message) {
        deploymentStatuses.allFatalErrors.push({
          deployment: status.subgraph,
          message: status.fatalError?.message
        });
      }
    }

    return deploymentStatuses;
  }

  static async getDecentralizedStatuses() {
    const names = ['graph-beanstalk', 'graph-bean'];
    const clients = [SubgraphClient.graphBeanstalk, SubgraphClient.graphBean];

    const deploymentStatuses = {};

    const currentBlock = (await (await providerThenable).getBlock()).number;

    const metas = await Promise.allSettled(clients.map(CommonSubgraphRepository.getMeta));
    for (let i = 0; i < metas.length; ++i) {
      // Rejected promise will occur when the subgraph does not exist
      if (metas[i].status === 'fulfilled') {
        deploymentStatuses[names[i]] = {
          deployment: metas[i].value.deployment,
          hasIndexingErrors: metas[i].value.hasIndexingErrors,
          indexedBlock: metas[i].value.block.number,
          blocksBehind: currentBlock - metas[i].value.block.number
        };
      } else {
        const errorMessage = metas[i].reason?.response?.errors?.[0]?.message || 'failed to obtain meta';
        deploymentStatuses[names[i]] = { error: errorMessage };
      }
    }

    return deploymentStatuses;
  }
}

function namesForDeployment(deploymentStatuses, deployment) {
  const retval = [];
  for (const name in deploymentStatuses) {
    if (deploymentStatuses[name].deployment === deployment) {
      retval.push(name);
    }
  }
  return retval;
}

function suffixForEnv(env) {
  if (env === 'prod') {
    return '';
  } else if (env === 'dev') {
    return '-dev';
  } else if (env === 'testing') {
    return '-testing';
  }
  throw new Error(`Invalid env provided: ${env}`);
}

module.exports = SubgraphService;
