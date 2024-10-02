class PromiseUtil {
  static async runBatchPromises(promiseGenerators, batchSize, resultCallback) {
    const allResults = [];
    while (promiseGenerators.length > 0) {
      const results = await Promise.all(
        promiseGenerators.splice(0, Math.min(batchSize, promiseGenerators.length)).map((p) => p())
      );
      allResults.push(...results);
      resultCallback && results.forEach(resultCallback);
    }
    return allResults;
  }

  static nullOnReject(promise) {
    return promise.catch(() => null);
  }
}

module.exports = PromiseUtil;
