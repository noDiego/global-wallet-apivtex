import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import winLogger from '../../config/winston.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const serviceName = context.switchToHttp().getRequest().route
      ? context.switchToHttp().getRequest().route.path
      : context.switchToHttp().getRequest().url;
    return next.handle().pipe(
      tap(() => {
        if (context.switchToHttp().getRequest().url != '/health')
          winLogger.info(`Response ${serviceName} - OK`, {
            context: context.getClass().name,
            status: context.switchToHttp().getResponse().statusCode,
            serviceName: serviceName,
          });
      }),
    );
  }
}
