import { envConfig } from '../config';

export const URLS: Record<string, any> = {
  walletApi: {
    vtexpayment: envConfig.walletApi.corePriv + '/pvt/payments',
  },
};
