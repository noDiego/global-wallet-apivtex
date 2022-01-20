/* eslint-disable */
import { Connection, getConnectionManager } from 'typeorm';
global.ENV = require('./config/index').ENV;
/* eslint-enable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winstonConfig from './config/winston.config';
import { envConfig } from './config';
import { CustomValidationPipe } from './common/pipes/custom-validation-pipe.service';
import { ErrorExceptionFilter } from './common/middleware/http-exception.filter';
import { LoggingInterceptor } from './common/middleware/logging.interceptor';

async function bootstrap() {
  if (envConfig.environment != 'local') require('newrelic');

  const options = {
    logger: WinstonModule.createLogger(winstonConfig), //Iniciar app con Winston como Logger
    cors: true,
  };

  const app = await NestFactory.create(AppModule, options);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new ErrorExceptionFilter());
  app.useGlobalPipes(new CustomValidationPipe());
  app.enableCors();

  await runMigrations();

  await app.listen(envConfig.server.port);
}

async function runMigrations() {
  const logger = new Logger('Migrations');
  const resultBD: boolean = getConnectionManager().connections[0].isConnected;
  if (resultBD) {
    const conn: Connection = getConnectionManager().connections[0];
    logger.log('Running Migrations...');
    try {
      await conn.runMigrations();
    } catch (e) {
      logger.error('Error executing Migration: ' + e.message());
      // logger.error('Reverting Last Migration...');
      // await conn.undoLastMigration();
    }
  }
}

bootstrap();
