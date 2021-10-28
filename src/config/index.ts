import * as dotenv from 'dotenv';
dotenv.config();
export const envConfig = {
  environment: process.env.NODE_ENV,
  vtexTesting: process.env.VTEX_TESTING=='1',
  server: {
    port: parseInt(process.env.APP_PORT || '3002', 10),
    origin: process.env.ORIGIN,
    kongKey: process.env.KONG_API_KEY,
    vtexAppKey: process.env.X_VTEX_API_APPKEY,
  },
  walletApi: {
    core: process.env.WALLET_URL,
    balance: process.env.WALLET_BALANCE_URL,
    providerKey: process.env.PROVIDER_APIKEY,
  },
  db: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA,
    synchronize: process.env.NODE_ENV == 'development',
  },
  vtex:{
    development: {
      port: '3002',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    },
    qa: {
      port: '3002',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    },
    production: {
      port: '3002',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    }
  }
};
