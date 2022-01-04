import { Body, Controller, Get, Logger, Param, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentMethodsDto } from '../interfaces/wallet/payment-methods.dto';
import { HeadersSessionDTO, HeadersDTO } from '../interfaces/wallet/headers.dto';
import { RequestHeader } from '../interfaces/wallet/request-header.decorator';
import { PaymentRequestDTO } from '../interfaces/wallet/payment-request.dto';
import { VtexService } from '../services/vtex.service';
import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';
import { CancellationRequestDTO, CancellationResponseDTO } from '../interfaces/wallet/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../interfaces/wallet/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../interfaces/wallet/refund.dto';
import { ResponseDTO } from '../interfaces/wallet/api-response.dto';
import { envConfig } from '../config';

@Controller(envConfig.vtexTesting ? 'api' : '')
export class VtexController {
  constructor(private vtexService: VtexService, private readonly logger: Logger) {}

  /**
   * @api {get} /payment-methods Request information on payment methods
   * @apiName Payment methods
   *
   * @apiSuccess {Array} paymentMethods Payment methods VTEX.
   */
  @Get('/payment-methods')
  async paymentMethods(): Promise<PaymentMethodsDto> {
    return {
      paymentMethods: ['Promissories'],
    };
  }

  /**
   * @api {post} /payments Receive information about the transaction
   * @apiName Payments
   *
   * @apiDescription
   */
  @Post('/payments')
  async payments(
    @RequestHeader(HeadersDTO) headers,
    @Body() paymentRequest: PaymentRequestDTO,
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<PaymentResponseDto> {
    const result: PaymentResponseDto = await this.vtexService.payment(paymentRequest);
    this.logger.log(headers);
    this.logger.log(request.headers);

    response.status(200).send(result).end();
    return;
  }

  /**
   * @api {post} /payments/:paymentId/confirmation Receive information about the transaction
   * @apiName Payments
   *
   * @apiDescription
   */
  @Post('/confirmation/:paymentId')
  async paymentConfirmation(
    @RequestHeader(HeadersSessionDTO) headers: any,
    @Param('paymentId') paymentId,
  ): Promise<ResponseDTO<null>> {
    return await this.vtexService.paymentConfirmation(paymentId, headers.appSession);
  }

  @Post('/payments/test')
  async paymentTest(@RequestHeader(HeadersDTO) headers: any): Promise<string> {
    return 'hola mundo';
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
  async cancellation(
    @RequestHeader(HeadersDTO) headers: any,
    @Param('paymentId') paymentId: string,
    @Body() cancellationRequest: CancellationRequestDTO,
    @Res() response: Response,
  ): Promise<CancellationResponseDTO> {
    const result: CancellationResponseDTO = await this.vtexService.cancellation(
      cancellationRequest,
      headers.appSession,
    );
    response
      .status(result.cancellationId ? 200 : 500)
      .send(result)
      .end();
    return;
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
  async settlements(
    @RequestHeader(HeadersDTO) headers: any,
    @Param('paymentId') paymentId: string,
    @Body() settlementsRequest: SettlementsRequestDTO,
    @Res() response: Response,
  ): Promise<SettlementsResponseDTO> {
    const result: SettlementsResponseDTO = await this.vtexService.settlements(settlementsRequest, headers.appSession);

    response
      .status(result.settleId ? 200 : 500)
      .send(result)
      .end();
    return;
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
  async refund(
    @RequestHeader(HeadersDTO) headers: any,
    @Param('paymentId') paymentId: string,
    @Body() refundRequest: RefundRequestDTO,
    @Res() response: Response,
  ): Promise<SettlementsResponseDTO> {
    const result: RefundResponseDTO = await this.vtexService.refund(refundRequest, headers.appSession);

    response
      .status(result.refundId ? 200 : 500)
      .send(result)
      .end();

    return;
  }
}
