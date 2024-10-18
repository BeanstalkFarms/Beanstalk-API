// Disable env. Mock entire module so the validations do not execute
jest.mock('../../src/utils/env', () => {
  return {
    isChainEnabled: jest.fn(),
    defaultChain: jest.fn().mockReturnValue('eth'),
    getAlchemyKey: jest.fn(),
    getEnabledChains: jest.fn(),
    getEnabledCronJobs: jest.fn(),
    getDeploymentEnv: jest.fn(),
    getDiscordWebhooks: jest.fn(),
    getDiscordPrefix: jest.fn(),
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
jest.mock('../../src/repository/postgres/models/index', () => ({}));
// Disables any discord messaging
jest.mock('../../src/utils/discord', () => ({}));
