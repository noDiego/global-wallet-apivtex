import * as dotenv from 'dotenv';
dotenv.config();
export const envConfig = {
  environment: process.env.NODE_ENV,
  server: {
    port: parseInt(process.env.APP_PORT || '3002', 10),
    origin: process.env.ORIGIN,
  },
  walletApi: {
    core: process.env.WALLET_URL,
    balance: process.env.WALLET_BALANCE_URL,
    kongKey: process.env.KONG_KEY
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
      port: '3000',
      url_core: 'http://localhost:3100',
      secret: 'epay-apivtex-qa',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
      urlApi: 'http://localhost:3000'
    },
    qa: {
      port: '3000',
      url_core: 'https://3oqflvojd4-vpce-017d2ba47f7b4fb0e.execute-api.us-east-1.amazonaws.com/prod/core-qa',
      secret: 'epay-apivtex-qa',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
      urlApi: 'https://apipaysquad.smdigital.cl/v1/cl/payment/oneclick-qa'
    },
    production: {
      port: '3000',
      url_core: 'https://3oqflvojd4-vpce-017d2ba47f7b4fb0e.execute-api.us-east-1.amazonaws.com/prod/core',
      secret: 'epay-apivtex',
      timeout: 45000,
      delayToAutoSettle: 604800,
      delayToAutoSettleAfterAntifraud: null,
      delayToCancel: 1800,
      urlApi: 'https://apipaysquad.smdigital.cl/v1/cl/payment/oneclick'
    }
  }
};
