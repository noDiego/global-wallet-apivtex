import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        response
            .status(status)
            // you can manipulate the response here
            .json({
                status: status,
                code: '002',
                message: exception.message,
            });
    }

    private formatErrors(errors: any[]) {
        return errors.map(error => {
            for (let key in error.constraints) {
                return error.constraints[key]
            }
        }).join(', ');
    }
}


