import { envConfig } from '../config';

export const URLS: Record<string, any> = {
  walletApi: {
    payment: envConfig.walletApi.core + '/pvt/vtexpayments',
    purchase: envConfig.walletApi.core + '/api/purchase',
    charge: envConfig.walletApi.core + '/api/charge',
    balance: envConfig.walletApi.core + '/api/amount',
  },
};
