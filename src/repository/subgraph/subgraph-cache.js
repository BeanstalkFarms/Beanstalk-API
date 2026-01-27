const { C } = require('../../constants/runtime-constants');
const redisClient = require('../../datasources/redis-client');
const { sendWebhookMessage } = require('../../utils/discord');
const Log = require('../../utils/logging');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const { SG_CACHE_CONFIG } = require('./cache-config');
const CommonSubgraphRepository = require('./common-subgraph');

// Caches past season results for configured queries, enabling retrieval of the full history to be fast
class SubgraphCache {
  // Introspection is required at runtime to build the schema.
  // If the schema of an underlying subgraph changes, the API must be redeployed (or apollo restarted).
  // Therefore the schema can be cached here rather than retrieved at runtime on each request.
  static initialIntrospection = {};
  static introspectionDeployment = {};

  static async get(cacheQueryName, where) {
    const sgName = SG_CACHE_CONFIG[cacheQueryName].subgraph;

    const introspection = this.initialIntrospection[sgName];

    const { latest, cache } = await this._getCachedResults(cacheQueryName, where);
    const freshResults = await this._queryFreshResults(cacheQueryName, where, latest, introspection);
    const aggregated = await this._aggregateAndCache(cacheQueryName, where, cache, freshResults);
    return aggregated;
  }

  static async clear(sgName) {
    let cursor = '0';
    do {
      const reply = await redisClient.scan(cursor, {
        MATCH: `sg:${sgName}:*`,
        COUNT: 100
      });
      if (reply.keys.length > 0) {
        await redisClient.del(...reply.keys);
      }
      cursor = reply.cursor;
    } while (cursor !== '0');
  }

  static async introspect(sgName) {
    const { deployment, schema } = await CommonSubgraphRepository.introspect(sgName);

    const fromCache = (await redisClient.get(`sg-deployment:${sgName}`)) === deployment;

    // Find the underlying types for each enabled query
    const queryInfo = {};
    const queryTypes = schema.types.find((t) => t.kind === 'OBJECT' && t.name === 'Query');
    for (const field of queryTypes.fields) {
      const configQuery = Object.entries(SG_CACHE_CONFIG).find(
        ([key, queryCfg]) => queryCfg.subgraph === sgName && queryCfg.queryName === field.name
      );
      if (configQuery) {
        let type = field.type;
        while (type.ofType) {
          type = type.ofType;
        }
        queryInfo[configQuery[0]] = {
          type: type.name
        };
      }
    }

    // Identify all fields accessible for each query
    for (const query in queryInfo) {
      const queryObject = schema.types.find((t) => t.kind === 'OBJECT' && t.name === queryInfo[query].type);
      queryInfo[query].fields = queryObject.fields.map((f) => {
        return { name: f.name, typeName: this._buildTypeName(f.type) };
      });
    }

    if (!fromCache) {
      await this._newDeploymentDetected(sgName, deployment);
    }

    this.introspectionDeployment[sgName] = deployment;
    return (this.initialIntrospection[sgName] = queryInfo);
  }

  static async _newDeploymentDetected(sgName, deployment) {
    Log.info(`New deployment detected; clearing subgraph cache for ${sgName}`);
    await this.clear(sgName);
    await redisClient.set(`sg-deployment:${sgName}`, deployment);
  }

  // Recursively build a type string to use in the re-exported schema
  // new Set(schema.types.flatMap((t) => t.fields?.flatMap((f) => f.type.kind)));
  static _buildTypeName(type) {
    if (['OBJECT', 'SCALAR', 'ENUM'].includes(type.kind)) {
      return type.name; // base case
    } else if (type.kind === 'NON_NULL') {
      return this._buildTypeName(type.ofType) + '!';
    } else if (type.kind === 'LIST') {
      return `[${this._buildTypeName(type.ofType)}]`;
    }
  }

  static async _getCachedResults(cacheQueryName, where) {
    const cfg = SG_CACHE_CONFIG[cacheQueryName];
    const redisResult = await redisClient.get(`sg:${cfg.subgraph}:${cacheQueryName}:${where}`);
    const cachedResults = JSON.parse(redisResult) ?? [];

    return {
      latest:
        cachedResults?.[cachedResults.length - 1]?.[
          cfg.paginationSettings.objectField ?? cfg.paginationSettings.field
        ] ?? cfg.paginationSettings.lastValue,
      cache: cachedResults
    };
  }

  static async _queryFreshResults(cacheQueryName, where, latestValue, introspection, c = C()) {
    const cfg = SG_CACHE_CONFIG[cacheQueryName];
    const sgClient = cfg.client(c);
    const results = await SubgraphQueryUtil.allPaginatedSG(
      sgClient,
      `{ ${cfg.queryName} { ${introspection[cacheQueryName].fields
        .filter((f) => !cfg.omitFields?.includes(f.name))
        .concat(cfg.syntheticFields?.map((f) => ({ name: f.queryAccessor })) ?? [])
        .map((f) => f.name)
        .join(' ')} } }`,
      '',
      where,
      { ...cfg.paginationSettings, lastValue: latestValue }
    );

    // If new deployment detected, clear the cache and send an alert that API might need restarting
    if (sgClient.meta.deployment !== this.introspectionDeployment[cfg.subgraph]) {
      sendWebhookMessage(
        `New deployment detected for ${cfg.subgraph}, the API might need to be restarted (if the schema changed).`
      );
      await this._newDeploymentDetected(cfg.subgraph, sgClient.meta.deployment);
    }

    for (const result of results) {
      for (const syntheticField of cfg.syntheticFields ?? []) {
        result[syntheticField.objectRewritePath] = syntheticField.objectAccessor(result);
      }
    }
    return results;
  }

  static async _aggregateAndCache(cacheQueryName, where, cachedResults, freshResults) {
    const cfg = SG_CACHE_CONFIG[cacheQueryName];
    // The final element was re-retrieved and included in the fresh results.
    const aggregated = [...cachedResults.slice(0, -1), ...freshResults];
    await redisClient.set(`sg:${cfg.subgraph}:${cacheQueryName}:${where}`, JSON.stringify(aggregated));
    return aggregated;
  }
}
module.exports = SubgraphCache;
