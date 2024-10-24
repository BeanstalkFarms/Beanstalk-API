import DepositDto from '../src/repository/dto/DepositDto';

export type DepositYield = {
  // Percentage growth in deposit's bdv
  bean: number;
  // Percentage growth in deposit's stalk
  stalk: number;
  // Percentage growth in the deposit's share of silo ownership
  ownership: number;
};

export type EmaInfo = {
  effectiveWindow: number;
  rewardBeans: string;
};

export type DepositYieldMap = {
  [asset: string]: DepositYield;
};

export type WindowYieldMap = {
  [window: number]: DepositYieldMap;
};

export type CalcApysResult = {
  season: number;
  yields: WindowYieldMap;
  initType: ApyInitType;
  ema: { [requestedWindow: string]: EmaInfo };
};

export type WindowEMAResult = {
  window: number;
  beansPerSeason: number;
};

export type Deposit = {
  // (user deposited stalk) / (user deposited bdv + user germinating bdv)
  stalkPerBdv: number;
  // [Even, Odd] germinating stalk ratio of this deposit type.
  // Each entry should be computed as: (user germinating stalk) / (user deposited bdv + user germinating bdv)
  germinating?: [number];
};

export const ApyInitType: {
  NEW: 'NEW';
  AVERAGE: 'AVERAGE';
};
export type ApyInitType = (typeof ApyInitType)[keyof typeof ApyInitType];

export type CalcApyOptions = {
  // Target number of hours for a deposit's grown stalk to catch up (for gauge only)
  catchUpRate?: number;
  // Whether to initialize apy calculation with a new deposit or an average deposit.
  initType?: ApyInitType;
  // Initial values of a deposit starting states. Takes precedence over initType
  initUserValues?: Deposit[];
  // The duration for which to calculate the apy (if other than 1 year)
  duration?: number;
  // Indicates whether any parameter validation should be skipped
  skipValidation?: number;
};

export type GetApyRequest = {
  season?: number;
  emaWindows?: number[];
  tokens?: string[];
  options?: CalcApyOptions;
};

export type GetApyHistoryRequest = {
  token: string;
  emaWindow: number;
  initType: ApyInitType;
  fromSeason: number;
  toSeason: number;
  // Identifies how many records to skip, i.e. pull one record for every 5 seasons
  interval?: number;
};

export type GetApyHistoryResult = {
  [season: number]: DepositYield;
};

export type SortType = 'absolute' | 'relative';
export type SortFields = 'bdv' | 'stalk' | 'seeds';
export type LambdaBdvType = 'increase' | 'decrease';

export type DepositsSortOptions = {
  type: SortType;
  field: SortFields;
};

export type GetDepositsRequest = {
  account?: string;
  token?: string;
  lambdaBdvChange?: LambdaBdvType;
  sort?: DepositsSortOptions;
  limit?: number;
  skip?: number;
};

export type GetDepositsResult = {
  // Block number
  lastUpdated: number;
  deposits: DepositDto[];
};
