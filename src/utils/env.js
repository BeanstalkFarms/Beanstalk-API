require('dotenv').config();
const { Network } = require('alchemy-sdk');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const ENABLED_CHAINS = process.env.ENABLED_CHAINS?.split(',').filter((s) => s.trim().length > 0);
const ENABLED_CRON_JOBS = process.env.ENABLED_CRON_JOBS?.split(',').filter((s) => s.trim().length > 0);

const NODE_ENV = process.env.NODE_ENV;

const DISCORD_NOTIFICATION_WEBHOOKS = process.env.DISCORD_NOTIFICATION_WEBHOOKS?.split(',').filter(
  (s) => s.trim().length > 0
);
const DISCORD_NOTIFICATION_PREFIX = process.env.DISCORD_NOTIFICATION_PREFIX ?? '';

const SG_BEANSTALK = (process.env.SG_BEANSTALK ?? '') !== '' ? process.env.SG_BEANSTALK : 'beanstalk';
const SG_BEAN = (process.env.SG_BEAN ?? '') !== '' ? process.env.SG_BEAN : 'bean';
const SG_BASIN = (process.env.SG_BASIN ?? '') !== '' ? process.env.SG_BASIN : 'basin';

// Validation
if (ENABLED_CHAINS.length === 0) {
  throw new Error('Invalid environment configured: no chains were enabled.');
}

for (const chain of ENABLED_CHAINS) {
  if (!Object.values(Network).includes(`${chain}-mainnet`)) {
    throw new Error(`Invalid environment configured: chain '${chain}-mainnet' not supported by Alchemy.`);
  }
}

class EnvUtil {
  static defaultChain() {
    return ENABLED_CHAINS[0];
  }

  static getAlchemyKey() {
    return ALCHEMY_API_KEY;
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

  // TODO: should probably provide one of these per chain
  static getSGBeanstalk() {
    return SG_BEANSTALK;
  }

  static getSGBean() {
    return SG_BEAN;
  }

  static getSGBasin() {
    return SG_BASIN;
  }
}

module.exports = EnvUtil;
