export const contracts = {
  MNQ: {
    name: 'Micro E-mini Nasdaq (MNQ)',
    margin: 50,
    tickValue: 0.50,
    tickSize: 0.25,
    description: '1/10ème du NQ standard',
    multiplier: 2,
    category: 'nasdaq'
  },
  NQ: {
    name: 'E-mini Nasdaq (NQ)',
    margin: 1000,
    tickValue: 5.00,
    tickSize: 0.25,
    description: 'Contrat standard Nasdaq',
    multiplier: 20,
    category: 'nasdaq'
  },
  MES: {
    name: 'Micro E-mini S&P 500 (MES)',
    margin: 50,
    tickValue: 1.25,
    tickSize: 0.25,
    description: '1/10ème du ES standard',
    multiplier: 5,
    category: 'sp500'
  },
  ES: {
    name: 'E-mini S&P 500 (ES)',
    margin: 1000,
    tickValue: 12.50,
    tickSize: 0.25,
    description: 'Contrat standard S&P 500',
    multiplier: 50,
    category: 'sp500'
  },
  MYM: {
    name: 'Micro E-mini Dow (MYM)',
    margin: 50,
    tickValue: 0.50,
    tickSize: 1.00,
    description: '1/10ème du YM standard',
    multiplier: 2,
    category: 'dow'
  },
  YM: {
    name: 'E-mini Dow (YM)',
    margin: 1000,
    tickValue: 5.00,
    tickSize: 1.00,
    description: 'Contrat standard Dow Jones',
    multiplier: 20,
    category: 'dow'
  },
  M2K: {
    name: 'Micro E-mini Russell 2000 (M2K)',
    margin: 50,
    tickValue: 0.50,
    tickSize: 0.10,
    description: '1/10ème du RTY standard',
    multiplier: 2,
    category: 'russell'
  },
  RTY: {
    name: 'E-mini Russell 2000 (RTY)',
    margin: 1000,
    tickValue: 5.00,
    tickSize: 0.10,
    description: 'Contrat standard Russell 2000',
    multiplier: 20,
    category: 'russell'
  },
  MCL: {
    name: 'Micro Crude Oil (MCL)',
    margin: 50,
    tickValue: 1.00,
    tickSize: 0.01,
    description: '1/10ème du CL standard',
    multiplier: 1,
    category: 'energy'
  },
  CL: {
    name: 'Crude Oil (CL)',
    margin: 1000,
    tickValue: 10.00,
    tickSize: 0.01,
    description: 'Contrat standard Crude Oil',
    multiplier: 10,
    category: 'energy'
  },
  MGC: {
    name: 'Micro Gold (MGC)',
    margin: 50,
    tickValue: 0.10,
    tickSize: 0.10,
    description: '1/10ème du GC standard',
    multiplier: 0.1,
    category: 'metals'
  },
  GC: {
    name: 'Gold (GC)',
    margin: 1000,
    tickValue: 1.00,
    tickSize: 0.10,
    description: 'Contrat standard Gold',
    multiplier: 1,
    category: 'metals'
  }
};