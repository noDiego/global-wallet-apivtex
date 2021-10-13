import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { GlobalModule } from "./application/modules/global.module";
import { LoggerMiddleware } from "./application/middleware/logger.middleware";

@Module({
  imports: [
    GlobalModule,
  ],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        // { path: '/api/auth/encrypt', method: RequestMethod.ALL },
        // { path: '/api/transactions/payment', method: RequestMethod.POST },
        // { path: '/api/transactions', method: RequestMethod.PUT },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
