export type DepositYield = {
  // Percentage growth in deposit's bdv
  bean: number;
  // Percentage growth in deposit's stalk
  stalk: number;
  // Percentage growth in the deposit's share of silo ownership
  ownership: number;
};

export type DepositYieldMap = {
  [asset: string]: DepositYield;
};

export type WindowYieldMap = {
  [window: number]: DepositYieldMap;
};

export type CalcApysResult = {
  beanstalk: string;
  season: number;
  yields: WindowYieldMap;
};

export type WindowEMAResult = {
  window: number;
  beansPerSeason: number;
};

export type Deposit = {
  stalkPerBdv: number;
  germinatingSeasons?: number;
};

export enum ApyInitType {
  NEW,
  AVERAGE
}

export type CalcApyOptions = {
  // Target number of hours for a deposit's grown stalk to catch up (for gauge only)
  catchUpRate?: number;
  // Whether to initialize apy calculation with a new deposit or an average deposit.
  initType?: ApyInitType;
  // Initial values of a deposit starting states. Takes precedence over initType
  initUserValues?: Deposit[];
  // The duration for which to calculate the apy (if other than 1 year)
  duration?: number;
};
