export type CalcApysOptions = {
  beanstalk: string;
  season: number;
  lookback: number;
  assets: string[];
};

export type TokenApy = {
  token: string;
  beanApy: number;
  stalkApy: number;
};

export type CalcApysResult = {
  beanstalk: string;
  season: number;
  lookback: number;
  apys: TokenApy[];
};
