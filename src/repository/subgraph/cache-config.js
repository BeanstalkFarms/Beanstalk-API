const { C } = require('../../constants/runtime-constants');

const paginationSettings = (fieldName, { objectField, objectAccessor, orderBy } = {}) => ({
  field: fieldName,
  lastValue: 0,
  direction: 'asc',
  // For synthetic fields
  objectField,
  objectAccessor,
  orderBy: orderBy ?? fieldName,
  // For multiple subgraphs
  arbStart: C('arb').MILESTONE.startSeason
});

// For multi subgraphs:
// Ok to keep subgraph name as a single string, this will be used for introspection and query key naming
// purposes. The schema will be the same for both subgraphs, and the results always used together.
// Added client configuration to specify which client to use based on the lastValue of the current query result.

// Selects the correct C to use for the next query based on the current latestValue.
// All paginations are currently based on season, so this is used universally.
const selectC = (latestValue) => {
  const cEth = C('eth');
  if (latestValue < cEth.MILESTONE.endSeason - 1) {
    return cEth;
  } else {
    return C('arb');
  }
};

// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const SG_CACHE_CONFIG = {
  //////// BEANSTALK SUBGRAPH /////////
  cache_siloHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['silo'],
    selectC,
    rewriteWhere: (where, c) => {
      return where.replace('__protocol__', `"${c.BEANSTALK}"`);
    }
  },
  cache_fieldHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'fieldHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['field'],
    selectC,
    rewriteWhere: (where, c) => {
      return where.replace('__protocol__', `"${c.BEANSTALK}"`);
    }
  },
  cache_podMarketplaceHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'podMarketplaceHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['podMarketplace'],
    selectC
  },
  cache_seasons: {
    subgraph: 'beanstalk',
    queryName: 'seasons',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['beanstalk'],
    selectC
  },
  cache_siloAssetHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloAssetHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['siloAsset'],
    selectC,
    rewriteWhere: (where, c) => {
      return where.replace('__protocol__', `"${c.BEANSTALK}"`);
    }
  },
  cache_unripeTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'unripeTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['underlyingToken', 'unripeToken'],
    selectC
  },
  cache_whitelistTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'whitelistTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['token'],
    selectC
  },
  //////// BEAN SUBGRAPH /////////
  cache_beanHourlySnapshots: {
    subgraph: 'bean',
    queryName: 'beanHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('season_: {season', {
      objectField: 'season',
      objectAccessor: (o) => o.season.season,
      orderBy: 'season__season'
    }),
    omitFields: ['bean', 'crossEvents', 'season'],
    syntheticFields: [
      {
        queryAccessor: 'season { season }',
        objectAccessor: (o) => o.season.season,
        objectRewritePath: 'season',
        typeName: 'Int!'
      }
    ],
    selectC
  },
  cache_poolHourlySnapshots: {
    subgraph: 'bean',
    queryName: 'poolHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('season_: {season', {
      objectField: 'season',
      objectAccessor: (o) => o.season.season,
      orderBy: 'season__season'
    }),
    omitFields: ['pool', 'season', 'crossEvents'],
    syntheticFields: [
      {
        queryAccessor: 'season { season }',
        objectAccessor: (o) => o.season.season,
        objectRewritePath: 'season',
        typeName: 'Int!'
      }
    ],
    selectC
  }
};

module.exports = { SG_CACHE_CONFIG };
