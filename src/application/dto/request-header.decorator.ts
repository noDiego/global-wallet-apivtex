import { BadRequestException, createParamDecorator, ExecutionContext, ForbiddenException, HttpException, HttpStatus } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";

export const RequestHeader = createParamDecorator(
    async (value:  any, ctx: ExecutionContext) => {

        // extract headers
        const headers = ctx.switchToHttp().getRequest().headers;

        // Convert headers to DTO object
        const dto = plainToClass(value, headers, { excludeExtraneousValues: true });

        // Validate
        return validateOrReject(dto).then(
            (res) => {
                return dto;
            },
            (err) => {
                throw new BadRequestException({
                    message: "Error in Credentials",
                    status: 'error',
                    code: 'ERR'
                });
            }
        );
    },
);
