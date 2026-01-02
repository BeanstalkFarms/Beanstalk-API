require('dotenv').config();
const ChainUtil = require('./chain');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const GRAPH_API_KEY = process.env.GRAPH_API_KEY;

const ENABLED_CHAINS = process.env.ENABLED_CHAINS?.split(',').filter((s) => s.trim().length > 0);
const ENABLED_CRON_JOBS = process.env.ENABLED_CRON_JOBS?.split(',').filter((s) => s.trim().length > 0);

const NODE_ENV = process.env.NODE_ENV;

const DISCORD_NOTIFICATION_WEBHOOKS = process.env.DISCORD_NOTIFICATION_WEBHOOKS?.split(',').filter(
  (s) => s.trim().length > 0
);
const DISCORD_NOTIFICATION_PREFIX = process.env.DISCORD_NOTIFICATION_PREFIX ?? '';

const SG_BEANSTALK = process.env.SG_BEANSTALK?.split(',').filter((s) => s.trim().length > 0);
const SG_BEAN = process.env.SG_BEAN?.split(',').filter((s) => s.trim().length > 0);
const SG_BASIN = process.env.SG_BASIN?.split(',').filter((s) => s.trim().length > 0);

const REDIS_URL = process.env.REDIS_URL;

// Validation
if (!ENABLED_CHAINS || ENABLED_CHAINS.length === 0) {
  throw new Error('Invalid environment configured: no chains were enabled.');
}

for (const chain of ENABLED_CHAINS) {
  if (!ChainUtil.isValidChain(chain)) {
    throw new Error(`Invalid environment configured: chain '${chain}-mainnet' not supported by Alchemy.`);
  }
}

if (
  SG_BEANSTALK?.length !== ENABLED_CHAINS.length ||
  SG_BEAN?.length !== ENABLED_CHAINS.length ||
  SG_BASIN?.length !== ENABLED_CHAINS.length
) {
  throw new Error(`Invalid environment configured: one subgraph name must be provided for each chain.`);
}

if (!REDIS_URL) {
  throw new Error('Invalid environment configured: REDIS_URL is not set.');
}

class EnvUtil {
  static isChainEnabled(chain) {
    return EnvUtil.getEnabledChains().includes(chain);
  }

  static defaultChain() {
    return ENABLED_CHAINS[0];
  }

  static getAlchemyKey() {
    return ALCHEMY_API_KEY;
  }

  static getGraphKey() {
    return GRAPH_API_KEY;
  }

  static getEnabledChains() {
    return ENABLED_CHAINS;
  }

  static getEnabledCronJobs() {
    return ENABLED_CRON_JOBS;
  }

  static getDeploymentEnv() {
    return NODE_ENV;
  }

  static getDiscordWebhooks() {
    return DISCORD_NOTIFICATION_WEBHOOKS;
  }

  static getDiscordPrefix() {
    return DISCORD_NOTIFICATION_PREFIX;
  }

  static getSG(chain) {
    const chainIndex = EnvUtil.getEnabledChains().indexOf(chain);
    return {
      BEANSTALK: SG_BEANSTALK[chainIndex],
      BEAN: SG_BEAN[chainIndex],
      BASIN: SG_BASIN[chainIndex]
    };
  }

  static getRedisUrl() {
    return REDIS_URL;
  }
}

module.exports = EnvUtil;
