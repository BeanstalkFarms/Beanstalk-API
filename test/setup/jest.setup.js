// Disable env. Mock entire module so the validations do not execute
jest.mock('../../src/utils/env', () => {
  return {
    isChainEnabled: jest.fn(),
    defaultChain: jest.fn().mockReturnValue('eth'),
    getCustomRpcUrl: jest.fn(),
    getAlchemyKey: jest.fn(),
    getEnabledChains: jest.fn(),
    getEnabledCronJobs: jest.fn(),
    getDeploymentEnv: jest.fn(),
    getDiscordWebhooks: jest.fn(),
    getDiscordPrefix: jest.fn(),
    getRedisUrl: jest.fn().mockReturnValue('redis://localhost:6379'),
    getSG: jest.fn().mockImplementation(() => ({
      BEANSTALK: 'a',
      BEAN: 'b',
      BASIN: 'c'
    }))
  };
});
// Disable alchemy config. Mock entire module so the static block does not execute
jest.mock('../../src/datasources/alchemy', () => {
  return {
    providerForChain: jest.fn()
  };
});
// Disables all database interactions
jest.mock('../../src/repository/postgres/models/index', () => {
  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn()
      })
    },
    Sequelize: {
      Op: {
        or: 'a',
        and: 'b'
      },
      literal: jest.fn()
    }
  };
});
// Disables any discord messaging
jest.mock('../../src/utils/discord', () => ({}));
