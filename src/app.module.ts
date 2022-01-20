import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { GlobalModule } from './modules/global.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { VtexModule } from './modules/vtex.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleAsyncOptions } from './config/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmModuleAsyncOptions), GlobalModule, VtexModule],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: '/api/health', method: RequestMethod.ALL })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
