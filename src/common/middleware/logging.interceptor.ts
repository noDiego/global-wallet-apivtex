import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import winLogger from '../../config/winston.config';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const serviceName = context.switchToHttp().getRequest().route
      ? context.switchToHttp().getRequest().route.path
      : context.switchToHttp().getRequest().url;
    return next.handle().pipe(
      tap(() => {
        if (context.switchToHttp().getRequest().url != '/health') {
          const paymentId = this.extractPaymentId(context.switchToHttp());
          const statusCode = context.switchToHttp().getResponse().statusCode;
          const msg =
            (paymentId ? `PaymentId:${paymentId} | ` : ``) +
            `Response ${serviceName} - ${statusCode >= 400 ? 'ERROR' : 'OK'}`;
          winLogger.info(msg, {
            context: context.getClass().name,
            status: context.switchToHttp().getResponse().statusCode,
            serviceName: serviceName,
          });
        }
      }),
    );
  }

  private extractPaymentId(httpArg: HttpArgumentsHost) {
    return httpArg.getRequest().body?.paymentId
      ? httpArg.getRequest().body.paymentId
      : httpArg.getRequest().data?.paymentId
      ? httpArg.getRequest().data.paymentId
      : undefined;
  }
}
