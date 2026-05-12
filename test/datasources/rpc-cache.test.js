const store = new Map();
const mockRedisClient = {
  get: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
  set: jest.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve();
  })
};

jest.mock('../../src/datasources/redis-client', () => mockRedisClient);

const RpcCache = require('../../src/datasources/rpc-cache');

describe('RpcCache', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test('caches historical contract reads by method, args, and blockTag', async () => {
    const contract = {
      balanceOf: jest.fn().mockResolvedValue(123n)
    };
    const cached = RpcCache.wrapContract(contract, '0x0000000000000000000000000000000000000001');

    await expect(cached.balanceOf('0x0000000000000000000000000000000000000002', { blockTag: 100 })).resolves.toEqual(
      123n
    );
    await expect(cached.balanceOf('0x0000000000000000000000000000000000000002', { blockTag: 100 })).resolves.toEqual(
      123n
    );

    expect(contract.balanceOf).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
    expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
  });

  test('skips cache for moving block tags', async () => {
    const contract = {
      balanceOf: jest.fn().mockResolvedValue(123n)
    };
    const cached = RpcCache.wrapContract(contract, '0x0000000000000000000000000000000000000001');

    await cached.balanceOf('0x0000000000000000000000000000000000000002', { blockTag: 'latest' });
    await cached.balanceOf('0x0000000000000000000000000000000000000002', { blockTag: 'safe' });
    await cached.balanceOf('0x0000000000000000000000000000000000000002', { blockTag: 'pending' });
    await cached.balanceOf('0x0000000000000000000000000000000000000002');

    expect(contract.balanceOf).toHaveBeenCalledTimes(4);
    expect(mockRedisClient.get).not.toHaveBeenCalled();
    expect(mockRedisClient.set).not.toHaveBeenCalled();
  });
});
