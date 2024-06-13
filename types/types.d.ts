export type DepositYield = {
  // The token that these yields were calculated for
  token: string;
  // Percentage growth in depositor's bdv
  beanYield: number;
  // Percentage growth in depositor's stalk
  stalkYield: number;
  // Percentage growth in depositor's silo ownership
  ownershipGrowth: number;
};

export type CalcApysResult = {
  beanstalk: string;
  season: number;
  window: number;
  apys: DepositYield[];
};

export type WindowEMAResult = {
  window: number;
  beansPerSeason: number;
};

export type Deposit = {
  bdv: number;
  stalk: number;
};

export type CalcApyOptions = {
  // Target number of hours for a deposit's grown stalk to catch up (for gauge only)
  catchUpRate?: number;
  // Initial values of a deposit starting states
  initialUserValues?: Deposit[];
  // The duration for which to calculate the apy (if other than 1 year)
  duration?: number;
};
