const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

class AsyncContext {
  static run(contextValues, callback) {
    return new Promise((resolve, reject) => {
      asyncLocalStorage.run(contextValues, async () => {
        try {
          await callback();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
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
