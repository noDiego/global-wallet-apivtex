import * as winston from 'winston';
import { envConfig } from './index';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const level = envConfig.isDev ? 'debug' : 'info';
const custFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const haveContext = metadata && metadata.context;
  return `${timestamp} ${haveContext ? '(' + metadata.context + ') ' : ''}[${level}] : ${message} `;
});

const format = envConfig.isDev
  ? winston.format.combine(winston.format.timestamp(), nestWinstonModuleUtilities.format.nestLike())
  : winston.format.combine(winston.format.timestamp(), winston.format.json());

const loggerConfig = {
  level: level,
  transports: [
    new winston.transports.Console({
      format: format,
      level: level,
    }),
  ],
  // other options
};

const winLogger: winston.Logger = winston.createLogger(loggerConfig);

export default winLogger;
