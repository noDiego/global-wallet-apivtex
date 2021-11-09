import * as winston from 'winston';
import { envConfig } from './index';

const custFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    const haveContext = metadata && metadata.context;
    return `${timestamp} ${
      haveContext ? '(' + metadata.context + ') ' : ''
    }[${level}] : ${message} `;
  },
);
export default {
  level: envConfig.environment == 'development' ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), custFormat),
    }),
    // other transports...
  ],
  // other options
};
