export type CalcApysOptions = {
  beanstalk: string;
  season: number;
  windows: number[];
  assets: string[];
};

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
}

export type CalcApysPreGaugeInputs = {
  // The current EMA
  beansPerSeason: number;
  // The token(s) calculating on (informational)
  tokens: string[];
  // The amount of seeds awarded per bdv for the whitelisted token(s) being calculated
  seedsPerTokenBdv: number[];
  // The amount of seeds awarded per bdv for bean deposits
  seedsPerBeanBdv: number;
  // Total outstanding stalk
  totalStalk: number;
  // Total outstanding seeds
  totalSeeds: number;
  // Initial values of a deposit starting states
  initialUserValues?: Deposit[];
  // The duration for which to calculate the apy (if other than 1 year)
  duration?: number;
}
