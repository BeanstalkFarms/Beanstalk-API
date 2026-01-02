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
  //////// PINTOSTALK SUBGRAPH /////////
  cache_siloHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['silo']
  },
  cache_fieldHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'fieldHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['field']
  },
  cache_gaugesInfoHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'gaugesInfoHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['gaugesInfo']
  },
  cache_marketPerformanceSeasonals: {
    subgraph: 'pintostalk',
    queryName: 'marketPerformanceSeasonals',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['silo']
  },
  cache_podMarketplaceHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'podMarketplaceHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['podMarketplace']
  },
  cache_seasons: {
    subgraph: 'pintostalk',
    queryName: 'seasons',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['beanstalk']
  },
  cache_siloAssetHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'siloAssetHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['siloAsset']
  },
  cache_tractorHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'tractorHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['tractor']
  },
  cache_unripeTokenHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'unripeTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['underlyingToken', 'unripeToken']
  },
  cache_whitelistTokenHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'whitelistTokenHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['token']
  },
  cache_wrappedDepositERC20HourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'wrappedDepositERC20HourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: paginationSettings('season'),
    omitFields: ['siloHourlySnapshot', 'token']
  },
  //////// PINTO SUBGRAPH /////////
  cache_beanHourlySnapshots: {
    subgraph: 'pinto',
    queryName: 'beanHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('seasonNumber'),
    omitFields: ['bean', 'crossEvents', 'season']
  },
  cache_farmerBalanceHourlySnapshots: {
    subgraph: 'pinto',
    queryName: 'farmerBalanceHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('seasonNumber'),
    omitFields: ['farmerBalance', 'season']
  },
  cache_poolHourlySnapshots: {
    subgraph: 'pinto',
    queryName: 'poolHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('seasonNumber'),
    omitFields: ['pool', 'season', 'crossEvents']
  },
  cache_tokenHourlySnapshots: {
    subgraph: 'pinto',
    queryName: 'tokenHourlySnapshots',
    client: (c) => c.SG.BEAN,
    paginationSettings: paginationSettings('seasonNumber'),
    omitFields: ['token', 'season']
  },
  //////// EXCHANGE SUBGRAPH /////////
  cache_beanstalkHourlySnapshots: {
    subgraph: 'exchange',
    queryName: 'beanstalkHourlySnapshots',
    client: (c) => c.SG.BASIN,
    paginationSettings: paginationSettings('season_: {season', {
      objectField: 'season',
      objectAccessor: (o) => o.season.season,
      orderBy: 'season__season'
    }),
    omitFields: ['season', 'wells'],
    syntheticFields: [
      {
        queryAccessor: 'season { season }',
        objectAccessor: (o) => o.season.season,
        objectRewritePath: 'season',
        typeName: 'Int!'
      }
    ]
  },
  cache_wellHourlySnapshots: {
    subgraph: 'exchange',
    queryName: 'wellHourlySnapshots',
    client: (c) => c.SG.BASIN,
    paginationSettings: paginationSettings('season_: {season', {
      objectField: 'season',
      objectAccessor: (o) => o.season.season,
      orderBy: 'season__season'
    }),
    omitFields: ['season', 'well'],
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
