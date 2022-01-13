// import { Body, Controller, Get, Logger, Param, Post, Res, Headers } from '@nestjs/common';
// import { Response } from 'express';
// import { ManifestDTO, PaymentMethodsDto } from '../interfaces/wallet/payment-methods.dto';
// import { HeadersDTO } from '../interfaces/wallet/headers.dto';
// import { RequestHeader } from '../interfaces/wallet/request-header.decorator';
// import { PaymentRequestDTO } from '../interfaces/wallet/payment-request.dto';
// import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';
// import { CancellationRequestDTO, CancellationResponseDTO } from '../interfaces/wallet/cancellation.dto';
// import { SettlementsRequestDTO, SettlementsResponseDTO } from '../interfaces/wallet/settlements.dto';
// import { RefundRequestDTO, RefundResponseDTO } from '../interfaces/wallet/refund.dto';
// import { VtexDefaultService } from '../services/vtex-default.service';
// import { envConfig } from '../config';
// import { ResponseDTO } from '../interfaces/wallet/api-response.dto';
//
// @Controller(envConfig.vtexTesting ? '' : 'vtex')
// export class VtexDefaultController {
//   constructor(private vtexService: VtexDefaultService, private readonly logger: Logger) {}
//
//   /**
//    * @api {get} /manifest Exposes provider manifest, a range of metadata settings, like payment methods, split configuration and custom fields.
//    * @apiName List Payment Provider Manifest
//    *
//    * @apiSuccess {Array} customFields Describes the customized fields supported by the connector.
//    * @apiSuccess {Array} paymentMethods Describes each payment method supported by payment provider and exposed its respective metadata.
//    */
//   @Get('/manifest')
//   async manifest(): Promise<ManifestDTO> {
//     return {
//       customFields: [],
//       paymentMethods: [
//         {
//           name: 'Promissories',
//           allowsSplit: 'disabled',
//         },
//       ],
//     };
//   }
//
//   /**
//    * @api {get} /payment-methods Request information on payment methods
//    * @apiName Payment methods
//    *
//    * @apiSuccess {Array} paymentMethods Payment methods VTEX.
//    */
//   @Get('/payment-methods')
//   async paymentMethods(): Promise<PaymentMethodsDto> {
//     return {
//       paymentMethods: ['Promissories'],
//     };
//   }
//
//   /**
//    * @api {post} /payments Receive information about the transaction
//    * @apiName Payments
//    *
//    * @apiDescription
//    */
//   @Post('/payments')
//   async payments(
//     @RequestHeader(HeadersDTO) headers: any,
//     @Headers() allHeaders,
//     @Body() paymentRequest: PaymentRequestDTO,
//     @Res() response: Response,
//   ): Promise<PaymentResponseDto> {
//     Logger.log('Payment. Headers recibidos ' + JSON.stringify(allHeaders));
//     const result: PaymentResponseDto = await this.vtexService.payment(paymentRequest);
//
//     response.status(200).send(result).end();
//     return;
//   }
//
//   /**
//    * @api {post} /payments/:paymentId/cancellations Cancels a payment that was not yet approved or captured
//    * @apiName Cancel Payment
//    *
//    * @apiParam {String} id payment unique ID.
//    *
//    * @apiSuccess {String} paymentId      VTEX payment ID from this payment.
//    * @apiSuccess {String} cancellationId Provider's cancellation identifier.
//    * @apiSuccess {String} code           Provider's operation/error code to be logged.
//    * @apiSuccess {String} message        Provider's operation/error message to be logged.
//    * @apiSuccess {String} requestId      The unique identifier for this request to ensure its idempotency.
//    */
//   @Post('/payments/:paymentId/cancellations')
//   async cancellation(
//     @RequestHeader(HeadersDTO) headers: any,
//     @Param('paymentId') paymentId: string,
//     @Body() cancellationRequest: CancellationRequestDTO,
//     @Res() response: Response,
//   ): Promise<CancellationResponseDTO> {
//     const result: CancellationResponseDTO = await this.vtexService.cancellation(cancellationRequest);
//     response
//       .status(result.cancellationId ? 200 : 500)
//       .send(result)
//       .end();
//     return;
//   }
//
//   /**
//    * @api {post} /payments/:paymentId/settlements Captures (settle) a payment that was previously approved
//    * @apiName Capture Payment
//    *
//    * @apiParam {String} id payment unique ID.
//    *
//    * @apiSuccess {String} paymentId VTEX payment ID from this payment.
//    * @apiSuccess {String} settleId  Provider's settlement identifier.
//    * @apiSuccess {String} value     The amount that was settled/captured.
//    * @apiSuccess {String} code      Provider's operation/error code to be logged.
//    * @apiSuccess {String} message   Provider's operation/error message to be logged.
//    * @apiSuccess {String} requestId The unique identifier for this request to ensure its idempotency.
//    */
//   @Post('/payments/:paymentId/settlements')
//   async settlements(
//     @RequestHeader(HeadersDTO) headers: any,
//     @Param('paymentId') paymentId: string,
//     @Body() settlementsRequest: SettlementsRequestDTO,
//     @Res() response: Response,
//   ): Promise<SettlementsResponseDTO> {
//     const result: SettlementsResponseDTO = await this.vtexService.settlements(settlementsRequest);
//
//     response
//       .status(result.settleId ? 200 : 500)
//       .send(result)
//       .end();
//     return;
//   }
//
//   /**
//    * @api {post} /payments/:paymentId/refunds Refunds a payment that was previously captured (settled)
//    * @apiName Capture Payment
//    *
//    * @apiParam {String} id payment unique ID.
//    *
//    * @apiSuccess {String} paymentId VTEX payment ID from this payment.
//    * @apiSuccess {String} refundId  Provider's refund identifier.
//    * @apiSuccess {String} value     The amount that was settled/captured.
//    * @apiSuccess {String} code      Provider's operation/error code to be logged.
//    * @apiSuccess {String} message   Provider's operation/error message to be logged.
//    * @apiSuccess {String} requestId The unique identifier for this request to ensure its idempotency.
//    */
//   @Post('/payments/:paymentId/refunds')
//   async refund(
//     @RequestHeader(HeadersDTO) headers: any,
//     @Param('paymentId') paymentId: string,
//     @Body() refundRequest: RefundRequestDTO,
//     @Res() response: Response,
//   ): Promise<SettlementsResponseDTO> {
//     const result: RefundResponseDTO = await this.vtexService.refund(refundRequest);
//
//     response
//       .status(result.refundId ? 200 : 500)
//       .send(result)
//       .end();
//
//     return;
//   }
//
//   @Post('/payments/test')
//   async paymentTest(@Body() holamundo: any): Promise<string> {
//     return holamundo;
//   }
//
//   @Post('/confirmation/:paymentId')
//   async confirmationTest(
//     @RequestHeader(HeadersDTO) headers: any,
//     @Param('paymentId') paymentId,
//   ): Promise<ResponseDTO<any>> {
//     return {
//       code: 0,
//       message: 'OK',
//       data: {
//         paymentId: paymentId,
//       },
//     };
//   }
//
//   @Get('/confirmation')
//   async confirmationHealth(@RequestHeader(HeadersDTO) headers: any): Promise<string> {
//     return 'hola mundo';
//   }
// }
