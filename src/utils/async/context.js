const { AsyncLocalStorage } = require('async_hooks');
const { sequelize } = require('../../repository/postgres/models');

const asyncLocalStorage = new AsyncLocalStorage();

class AsyncContext {
  static run(contextValues, callback) {
    return new Promise((resolve, reject) => {
      asyncLocalStorage.run(contextValues, async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Create a context including the db transaction
  static sequelizeTransaction(callback) {
    if (AsyncContext.getOrUndef('transaction')) {
      // No need to open another transaction if one is already open
      return callback();
    }
    return new Promise(async (resolve, reject) => {
      const transaction = await sequelize.transaction();
      // Maintains current context variables if one exists
      const currentStore = asyncLocalStorage.getStore() ?? {};
      try {
        const result = await AsyncContext.run({ transaction, ...currentStore }, callback);
        await transaction.commit();
        resolve(result);
      } catch (e) {
        await transaction.rollback();
        reject(e);
      }
    });
  }

  static get(key) {
    const store = asyncLocalStorage.getStore();
    if (!store) {
      throw new Error('AsyncContext.get() called outside of an established context');
    }
    return store[key];
  }

  static getOrUndef(key) {
    const store = asyncLocalStorage.getStore();
    return store?.[key];
  }
}

module.exports = AsyncContext;
