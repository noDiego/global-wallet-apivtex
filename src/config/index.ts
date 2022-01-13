import * as dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  environment: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development',
  vtexTesting: process.env.VTEX_TESTING == '1',
  aws: {
    region: process.env.AWS_SECRET_REGION,
    secretName: process.env.AWS_SECRET_NAME,
  },
  server: {
    port: parseInt(process.env.APP_PORT || '3002', 10),
    origin: process.env.ORIGIN,
    vtexAppKey: process.env.X_VTEX_API_APPKEY,
    vtexAppToken: process.env.X_VTEX_API_APPTOKEN,
  },
  walletApi: {
    core: process.env.WALLET_CORE_URL,
    corePriv: process.env.WALLET_PRIV_URL,
    balance: process.env.WALLET_BALANCE_URL,
    apiKey: process.env.WALLET_CORE_API_KEY,
  },
  db: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA || undefined,
    synchronize: true,
  },
  vtex: {
    jumbo: {
      apptoken: process.env.VTEX_JUMBO_APPTOKEN,
      appkey: process.env.VTEX_JUMBO_APPKEY,
    },
    development: {
      port: process.env.APP_PORT,
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    },
    qa: {
      port: process.env.APP_PORT,
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    },
    production: {
      port: process.env.APP_PORT,
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
    },
  },
};
