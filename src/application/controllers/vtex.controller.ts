import { BadRequestException, Body, Controller, Get, Logger, Post, Res, UsePipes } from "@nestjs/common";
import { Response } from 'express'
import { PaymentMethodsDto } from "../dto/payment-methods.dto";
import { HeadersDTO } from "../dto/headers.dto";
import { RequestHeader } from "../dto/request-header.decorator";
import { PaymentRequestDTO } from "../dto/payment-request.dto";
import { CustomValidationPipe } from "../pipes/custom-validation-pipe.service";
import { VtexService } from "../../domain/services/vtex.service";
import { PaymentResponseDto } from "../dto/payment-response.dto";

@Controller('')
export class VtexController {
    constructor(private vtexService: VtexService,
                private readonly logger: Logger,) {

    }

    /**
     * @api {get} /payment-methods Request information on payment methods
     * @apiName Payment methods
     *
     * @apiSuccess {Array} paymentMethods Payment methods VTEX.
     */
    @Get('/payment-method')
    async paymentMethods(@RequestHeader(HeadersDTO) headers: any): Promise<PaymentMethodsDto> {
        return {
            paymentMethods: ['Promissories']
        };
    }

    /**
     * @api {get} /payment-methods Request information on payment methods
     * @apiName Payment methods
     *
     * @apiSuccess {Array} paymentMethods Payment methods VTEX.
     */
    @Get('public/payment-method')
    async paymentMethodsPublic(): Promise<PaymentMethodsDto> {
        return {
            paymentMethods: ['Promissories']
        };
    }

    /**
     * @api {post} /payments Receive information about the transaction
     * @apiName Payments
     *
     * @apiDescription
     */
    @Post('payments')
    async payments(@RequestHeader(HeadersDTO) headers: any, @Body() paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
        //throw new BadRequestException({message: ['asd','dsa']})
        return this.vtexService.payment(paymentRequest);
    }
}
