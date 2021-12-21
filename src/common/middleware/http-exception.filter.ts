import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import winLogger from '../../config/winston.config';
import { ResponseDTO } from '../../interfaces/wallet/api-response.dto';

@Catch(Error)
export class ErrorExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const isHttpException = exception instanceof HttpException;
    const serviceName = host.switchToHttp().getRequest().route
      ? host.switchToHttp().getRequest().route.path
      : host.switchToHttp().getRequest().url;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseData: ResponseDTO<any> = {
      code: status,
      message: status < 500 ? exception.message : 'INTERNAL_SERVER_ERROR',
    };

    winLogger.error(`Response ${serviceName} - ERROR. Message: ${exception.message}`, {
      status: status,
      serviceName: serviceName,
    });

    response.status(status).json(responseData);
  }
}
