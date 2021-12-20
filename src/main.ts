/* eslint-disable */

import { AwsClient } from './infrastructure/client/aws.client';

global.ENV = require('./config/index').ENV;
/* eslint-enable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winstonConfig from './config/winston.config';
import { envConfig } from './config';
import { HttpExceptionFilter } from './application/middleware/http-exception.filter';
import { CustomValidationPipe } from './application/pipes/custom-validation-pipe.service';

async function bootstrap() {
  if (envConfig.environment != 'local') require('newrelic');

  const logger = new Logger('bootstrap');
  const options = {
    logger: WinstonModule.createLogger(winstonConfig), //Iniciar app con Winston como Logger
    cors: true,
  };

  const app = await NestFactory.create(AppModule, options);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new CustomValidationPipe());

  if (envConfig.environment == 'development') app.enableCors();
  else {
    logger.log(`Accepting requests from origin "${envConfig.server.origin}`);
    app.enableCors({ origin: envConfig.server.origin });
  }

  await app.listen(envConfig.server.port);
}

bootstrap();
