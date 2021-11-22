import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const isHttp = exception instanceof HttpException;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = isHttp ? exception.getStatus() : 500;

    const responseData = {
      code: status,
      message: isHttp ? exception.message : 'Internal Server Error',
    };
    Logger.error(`Error Catched - code: ${status} message: ${exception.message} stack: ${exception.stack}`);

    response.status(status).json(responseData);
  }
}
