import { envConfig } from '../config';

export const URLS: Record<string, any> = {
  walletApi: {
    payment: envConfig.walletApi.core + '/api/transactions/payments',
    purchase: envConfig.walletApi.core + '/api/transactions/purchase',
    charge: envConfig.walletApi.core + '/api/transactions/charge',
    balance: envConfig.walletApi.core + '/api/transactions/amount',
  },
};
