import { Body, Controller, Get, Logger, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ManifestDTO, PaymentMethodsDto } from '../interfaces/wallet/payment-methods.dto';
import { ConfirmationHeaders, HeadersDTO } from '../interfaces/wallet/headers.dto';
import { RequestHeader } from '../interfaces/wallet/request-header.decorator';
import { PaymentRequestDTO } from '../interfaces/wallet/payment-request.dto';
import { VtexService } from '../services/vtex.service';
import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';
import { CancellationRequestDTO, CancellationResponseDTO } from '../interfaces/wallet/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../interfaces/wallet/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../interfaces/wallet/refund.dto';
import { envConfig } from '../config';
import { CoreResponse } from '../interfaces/dto/core-transaction.dto';

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

  @Get('/manifest')
  async manifest(): Promise<ManifestDTO> {
    return {
      customFields: [],
      paymentMethods: [
        {
          name: 'Promissories',
          allowsSplit: 'disabled',
        },
      ],
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
    this.logger.log('[DEBUG] Payment Headers: ' + JSON.stringify(request.headers));
    const result: PaymentResponseDto = await this.vtexService.payment(paymentRequest);
    response.status(200).send(result).end();
    return;
  }

  /**
   * @api {post} /payments/:paymentId/confirmation Receive information about the transaction
   * @apiName Payments
   *
   * @apiDescription
   */
  @Post('/pvt/confirmation/:paymentId')
  async paymentConfirmation(
    @RequestHeader(ConfirmationHeaders) headers: any,
    @Param('paymentId') paymentId,
    @Req() request,
  ): Promise<CoreResponse> {
    this.logger.log('[DEBUG] Confirmation Headers: ' + JSON.stringify(request.headers));
    return await this.vtexService.paymentConfirmation(paymentId, headers.xapisession, headers.xapitoken);
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
    @Req() request: Request,
  ): Promise<CancellationResponseDTO> {
    this.logger.log('[DEBUG] Cancellation Headers: ' + JSON.stringify(request.headers));
    const result: CancellationResponseDTO = await this.vtexService.cancellation(cancellationRequest);
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
    @Req() request: Request,
  ): Promise<SettlementsResponseDTO> {
    this.logger.log('[DEBUG] Settlemet Headers: ' + JSON.stringify(request.headers));
    const result: SettlementsResponseDTO = await this.vtexService.settlements(settlementsRequest);

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
    @Req() request: Request,
  ): Promise<SettlementsResponseDTO> {
    this.logger.log('[DEBUG] Refund Headers: ' + JSON.stringify(request.headers));
    const result: RefundResponseDTO = await this.vtexService.refund(refundRequest);

    response
      .status(result.refundId ? 200 : 500)
      .send(result)
      .end();

    return;
  }
}