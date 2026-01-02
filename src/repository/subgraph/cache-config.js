const paginationSettings = (fieldName, { objectField, objectAccessor, orderBy } = {}) => ({
  field: fieldName,
  lastValue: 0,
  direction: 'asc',
  // For synthetic fields
  objectField,
  objectAccessor,
  orderBy: orderBy ?? fieldName
});

// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const SG_CACHE_CONFIG = {
  //////// BEANSTALK SUBGRAPH /////////
  cache_siloHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['silo']
  },
  cache_fieldHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'fieldHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['field']
  },
  cache_podMarketplaceHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'podMarketplaceHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['podMarketplace']
  },
  cache_seasons: {
    subgraph: 'beanstalk',
    queryName: 'seasons',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['beanstalk']
  },
  cache_siloAssetHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'siloAssetHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['siloAsset']
  },
  cache_unripeTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'unripeTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['underlyingToken', 'unripeToken']
  },
  cache_whitelistTokenHourlySnapshots: {
    subgraph: 'beanstalk',
    queryName: 'whitelistTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['token']
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
    ]
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
    ]
  }
};

module.exports = { SG_CACHE_CONFIG };
