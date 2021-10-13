import * as dotenv from 'dotenv';
dotenv.config();
export const envConfig = {
  environment: process.env.NODE_ENV,
  server: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    origin: process.env.ORIGIN,
  },
};
