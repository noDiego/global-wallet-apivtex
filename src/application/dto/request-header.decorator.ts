import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export const RequestHeader = createParamDecorator(
  async (value: any, ctx: ExecutionContext) => {
    // extract headers
    const headers = ctx.switchToHttp().getRequest().headers;

    // Convert headers to DTO object
    const dto = plainToClass(value, headers, { excludeExtraneousValues: true });

    // Validate
    return validateOrReject(dto).then(
      () => {
        return dto;
      },
      () => {
        throw new UnauthorizedException({
          message: 'Invalid authentication credentials',
        });
      },
    );
  },
);
