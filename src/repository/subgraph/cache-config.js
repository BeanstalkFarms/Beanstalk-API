const { C } = require('../../constants/runtime-constants');

const paginationSettings = (fieldName, { objectField, objectAccessor, orderBy } = {}) => ({
  field: fieldName,
  lastValue: 0,
  direction: 'asc',
  // For synthetic fields
  objectField,
  objectAccessor,
  orderBy: orderBy ?? fieldName
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

// TODO: Need to add something to accommodate different protocol address changing between L1->L2.
// Relevant to several of the queries.

// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const SG_CACHE_CONFIG = {
  //////// BEANSTALK SUBGRAPH /////////
  cache_siloHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['silo']
  },
  cache_fieldHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'fieldHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['field']
  },
  cache_podMarketplaceHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'podMarketplaceHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['podMarketplace']
  },
  cache_seasons: {
    subgraph: 'beanstalk',
    queryName: 'seasons',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['beanstalk']
  },
  cache_siloAssetHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloAssetHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['siloAsset']
  },
  cache_unripeTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'unripeTokenHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['underlyingToken', 'unripeToken']
  },
  cache_whitelistTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'whitelistTokenHourlySnapshots',
    selectC,
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['token']
  },
  //////// BEAN SUBGRAPH /////////
  cache_beanHourlySnapshots: {
    subgraph: 'bean',
    queryName: 'beanHourlySnapshots',
    selectC,
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
    ]
  },
  cache_poolHourlySnapshots: {
    subgraph: 'bean',
    queryName: 'poolHourlySnapshots',
    selectC,
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
    ]
  }
};

module.exports = { SG_CACHE_CONFIG };
