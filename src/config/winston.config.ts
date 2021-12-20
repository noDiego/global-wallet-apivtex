import * as winston from 'winston';
import { envConfig } from './index';
import { utilities as nestUtilites } from 'nest-winston';

const custFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const haveContext = metadata && metadata.context;
  return `${timestamp} ${haveContext ? '(' + metadata.context + ') ' : ''}[${level}] : ${message} `;
});
export default {
  level: envConfig.environment == 'development' || envConfig.environment == 'local' ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        envConfig.isLocal ? nestUtilites.format.nestLike() : custFormat,
      ),
    }),
    // other transports...
  ],
  // other options
};
