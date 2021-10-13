import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winstonConfig from './config/winston.config';
import { envConfig } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const options = {
    logger: WinstonModule.createLogger(winstonConfig), //Iniciar app con Winston como Logger
    cors: true,
  };

  const app = await NestFactory.create(AppModule, options);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  if (envConfig.environment == 'development') app.enableCors();
  else {
    logger.log(`Accepting requests from origin "${envConfig.server.origin}`);
    app.enableCors({ origin: envConfig.server.origin });
  }

  const documentOptions = new DocumentBuilder()
    .setTitle('Cencosud Wallet API')
    .setDescription('Cencosud Wallet API Description')
    .setVersion('1.0')
    .addTag('wallet')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, documentOptions);
  SwaggerModule.setup('api', app, document);

  await app.listen(3002);
}

bootstrap();
