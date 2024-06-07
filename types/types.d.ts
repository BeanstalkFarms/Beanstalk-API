export type CalcApysOptions = {
  beanstalk: string;
  season: number;
  window: number;
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
  window: number;
  apys: TokenApy[];
};

export type WindowEMAResult = {
  window: number;
  beansPerSeason: number;
};
