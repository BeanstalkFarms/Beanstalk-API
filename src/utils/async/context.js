const { AsyncLocalStorage } = require('async_hooks');
const { sequelize } = require('../../repository/postgres/models');

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

  static sequelizeTransaction(callback) {
    return new Promise(async (resolve, reject) => {
      // Create a context including the db transaction
      const transaction = await sequelize.transaction();
      const currentStore = asyncLocalStorage.getStore() ?? {};
      try {
        await AsyncContext.run({ transaction, ...currentStore }, callback);
        await transaction.commit();
        resolve();
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
