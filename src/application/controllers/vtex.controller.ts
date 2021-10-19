import { Body, Controller, Get, Logger, Param, Post, Res } from "@nestjs/common";
import { Response } from 'express'
import { PaymentMethodsDto } from "../dto/payment-methods.dto";
import { HeadersDTO } from "../dto/headers.dto";
import { RequestHeader } from "../dto/request-header.decorator";
import { PaymentRequestDTO } from "../dto/payment-request.dto";
import { VtexService } from "../../domain/services/vtex.service";
import { PaymentResponseDto } from "../dto/payment-response.dto";
import { CancellationRequestDTO, CancellationResponseDTO } from "../dto/cancellation.dto";
import { SettlementsRequestDTO, SettlementsResponseDTO } from "../dto/settlements.dto";
import { RefundRequestDTO, RefundResponseDTO } from "../dto/refund.dto";

@Controller('vtex')
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
    @Get('/payment-methods')
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
    @Post('/payments')
    async payments(@RequestHeader(HeadersDTO) headers: any, @Body() paymentRequest: PaymentRequestDTO, @Res() response: Response): Promise<PaymentResponseDto> {
        //throw new BadRequestException({message: ['asd','dsa']})
        const result: PaymentResponseDto = await this.vtexService.payment(paymentRequest);
        response.status(result.tid ? 200 : 500).send(result).end();
        return;
    }

    /**
     * @api {post} /payments/:paymentId/cancellations Cancels a payment that was not yet approved or captured
     * @apiName Cancel Payment
     *
     * @apiParam {String} id payment unique ID.
     *
     * @apiSuccess {String} paymentId      VTEX payment ID from this payment.
     * @apiSuccess {String} cancellationId Provider's cancellation identifier.
     * @apiSuccess {String} code           Provider's operation/error code to be logged.
     * @apiSuccess {String} message        Provider's operation/error message to be logged.
     * @apiSuccess {String} requestId      The unique identifier for this request to ensure its idempotency.
     */
    @Post('/payments/:paymentId/cancellations')
    async cancellation(@RequestHeader(HeadersDTO) headers: any,
                       @Param('paymentId') paymentId: string,
                       @Body() cancellationRequest: CancellationRequestDTO,
                       @Res() response: Response): Promise<CancellationResponseDTO> {
        const result: CancellationResponseDTO = await this.vtexService.cancellation(cancellationRequest);

        if (!result.cancellationId) {
            response.status(500).send(result).end();
        } else {
            return result;
        }
    }

    /**
     * @api {post} /payments/:paymentId/settlements Captures (settle) a payment that was previously approved
     * @apiName Capture Payment
     *
     * @apiParam {String} id payment unique ID.
     *
     * @apiSuccess {String} paymentId VTEX payment ID from this payment.
     * @apiSuccess {String} settleId  Provider's settlement identifier.
     * @apiSuccess {String} value     The amount that was settled/captured.
     * @apiSuccess {String} code      Provider's operation/error code to be logged.
     * @apiSuccess {String} message   Provider's operation/error message to be logged.
     * @apiSuccess {String} requestId The unique identifier for this request to ensure its idempotency.
     */
    @Post('/payments/:paymentId/settlements')
    async settlements(@RequestHeader(HeadersDTO) headers: any,
                      @Param('paymentId') paymentId: string,
                      @Body() settlementsRequest: SettlementsRequestDTO,
                      @Res() response: Response): Promise<SettlementsResponseDTO> {
        const result: SettlementsResponseDTO = await this.vtexService.settlements(settlementsRequest);

        if (!result.settleId) {
            response.status(500).send(result).end();
        } else {
            return result;
        }
    }

    /**
     * @api {post} /payments/:paymentId/refunds Refunds a payment that was previously captured (settled)
     * @apiName Capture Payment
     *
     * @apiParam {String} id payment unique ID.
     *
     * @apiSuccess {String} paymentId VTEX payment ID from this payment.
     * @apiSuccess {String} refundId  Provider's refund identifier.
     * @apiSuccess {String} value     The amount that was settled/captured.
     * @apiSuccess {String} code      Provider's operation/error code to be logged.
     * @apiSuccess {String} message   Provider's operation/error message to be logged.
     * @apiSuccess {String} requestId The unique identifier for this request to ensure its idempotency.
     */
    @Post('/payments/:paymentId/refunds')
    async refund(@RequestHeader(HeadersDTO) headers: any,
                 @Param('paymentId') paymentId: string,
                 @Body() refundRequest: RefundRequestDTO,
                 @Res() response: Response): Promise<SettlementsResponseDTO> {
        const result: RefundResponseDTO = await this.vtexService.refund(refundRequest);

        if (!result.refundId) {
            response.status(500).send(result).end();
        } else {
            return result;
        }
    }
}
