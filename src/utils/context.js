const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

class AsyncContext {
  static run(contextValues, callback) {
    asyncLocalStorage.run(contextValues, callback);
  }

  static get(key) {
    const store = asyncLocalStorage.getStore();
    if (!store) {
      throw new Error('AsyncContext.get() called outside of an established context');
    }
    return store[key];
  }
}

module.exports = AsyncContext;
