import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { PaymentRequestDTO } from '../../application/dto/payment-request.dto';
import { PaymentResponseDto } from '../../application/dto/payment-response.dto';
import { envConfig } from '../../config';
import { CancellationRequestDTO, CancellationResponseDTO } from '../../application/dto/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../../application/dto/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../../application/dto/refund.dto';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentOperation, VtexTransactionStatus, VtexStatus } from '../../infrastructure/enums/vtex.enum';
import { ResponseDTO } from '../../application/dto/api-response.dto';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';
import { VtexRequestDto } from '../../application/dto/vtex-request.dto';
import { VtexTransactionDto } from '../../infrastructure/dto/vtex-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import {
  CoreResponse,
  CoreTransactionReq,
  CoreTransactionRes,
  TransactionStatus,
} from '../../infrastructure/dto/core-transaction.dto';

@Injectable()
export class VtexService {
  constructor(
    private walletApiClient: WalletApiClient,
    private recordRep: VtexRecordRepository,
    private transactionRep: VtexTransactionRepository,
    private readonly logger: Logger,
  ) {}

  async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
    let vtexTransaction: VtexTransactionDto;
    let exist = true;
    try {
      //const validCard: boolean = validateCardNumber(paymentRequest.card.number);
      this.logger.log(`Payment - Iniciando... | paymentId:${paymentRequest.paymentId}`);

      vtexTransaction = await this.transactionRep.getPayment(paymentRequest.paymentId);
      if (!vtexTransaction) {
        exist = false;
        const vtexData: VtexRequestDto = {
          orderId: paymentRequest.orderId,
          transactionNumber: uuidv4(),
          paymentId: paymentRequest.paymentId,
          value: paymentRequest.value,
          clientEmail: paymentRequest.miniCart.buyer.email,
          merchantName: paymentRequest.merchantName,
          callbackUrl: paymentRequest.callbackUrl,
        };
        vtexTransaction = await this.transactionRep.saveTransaction(vtexData, PaymentOperation.PAYMENT, null);
      }

      const response: PaymentResponseDto = {
        acquirer: null,
        authorizationId: null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: vtexTransaction.transactionNumber,
        paymentId: paymentRequest.paymentId,
        status: VtexStatus.UNDEFINED,
        tid: vtexTransaction.transactionNumber,
        paymentUrl: paymentRequest.returnUrl,
        code: String(0),
        message: !exist ? '' : 'Transaction saved. ' + 'Waiting for confirmation',
      };

      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, response);
      this.logger.log(`Payment - Terminado | paymentId:${paymentRequest.paymentId} - status: ${response.status}`);
      return response;
    } catch (e) {
      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, e.stack);
      this.logger.error(
        `Payment - Error al ejecutar Payment | paymentId:${paymentRequest.paymentId} - Error:${e.message}`,
        e.stack,
      );
      throw e;
    }
  }

  async paymentConfirmation(paymentId: string, commerceSession: string): Promise<ResponseDTO<null>> {
    const vtexTransaction: VtexTransactionDto = await this.transactionRep.getPayment(paymentId);

    this.logger.log(`Confirmation - Iniciando... | paymentId:${paymentId}`);

    try {
      const paymentWalletReq: CoreTransactionReq = {
        amount: vtexTransaction.amount,
        orderId: vtexTransaction.orderId,
      };

      if (vtexTransaction.status == VtexTransactionStatus.CANCELED) {
      }

      const paymentResult: ResponseDTO<CoreTransactionRes> = await this.walletApiClient.payment(
        paymentWalletReq,
        'JUMBO', //vtexTransaction.merchantName, //TODO: Ver esto
        commerceSession,
      );
      const transactionRes: CoreTransactionRes = paymentResult.data;

      const response: PaymentResponseDto = {
        acquirer: null, // paymentRequest.card.holder || 'VTEX',
        authorizationId: paymentResult.code == 0 ? transactionRes.authorizationCode : null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: vtexTransaction.transactionNumber,
        paymentId: paymentId,
        status: transactionRes.status == TransactionStatus.APPROVED ? VtexStatus.APPROVED : VtexStatus.DENIED,
        tid: vtexTransaction.transactionNumber,
        paymentUrl: vtexTransaction.callbackUrl,
        code: String(paymentResult.code),
        message: paymentResult.message,
      };

      const vtexRequest: VtexRequestDto = {
        orderId: paymentResult.code == 0 ? transactionRes.id : null,
        transactionNumber: vtexTransaction.transactionNumber,
        paymentId: paymentId,
        value: vtexTransaction.amount,
        callbackUrl: vtexTransaction.callbackUrl,
      };
      await this.transactionRep.saveTransaction(vtexRequest, PaymentOperation.CONFIRMATION, transactionRes);

      await this.transactionRep.updatePaymentStatus(paymentId, VtexTransactionStatus.CONFIRMED);

      await this.recordRep.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, null);
      this.logger.log(`Confirmation - Enviando respuesta a VTEX | paymentId:${paymentId} - status: ${response.status}`);
      if (!envConfig.isDev) await this.walletApiClient.callback(vtexTransaction.callbackUrl, response);

      return { code: 0, message: `paymentId:${paymentId} confirmado OK.` };
    } catch (e) {
      this.logger.error(
        `Confirmation - Error al ejecutar Async Payment | paymentId:${paymentId}. Error: ${e.message}`,
        e,
      );
      await this.recordRep.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, e.stack);
      throw e;
    }
  }
  async cancellation(
    cancellationRequest: CancellationRequestDTO,
    commerceSession: string,
  ): Promise<CancellationResponseDTO> {
    let response: CancellationResponseDTO;
    let cancelResp: CoreResponse;

    this.logger.log(`Cancellation - Iniciada | paymentId:${cancellationRequest.paymentId}`);

    const transaction: VtexTransactionDto = await this.transactionRep.getPayment(cancellationRequest.paymentId);

    if (transaction.status == VtexTransactionStatus.CANCELED) {
      return {
        paymentId: cancellationRequest.paymentId,
        cancellationId: null,
        code: '1',
        message: 'Payment ya se encuentra cancelado',
        requestId: cancellationRequest.requestId,
      };
    } else if (transaction.status == VtexTransactionStatus.CONFIRMED) {
      cancelResp = await this.walletApiClient.refund(transaction.paymentId, transaction.amount, commerceSession);
    }

    try {
      const vtexData: VtexRequestDto = {
        orderId: cancelResp.data.id,
        transactionNumber: transaction.transactionNumber,
        paymentId: cancellationRequest.paymentId,
        requestId: cancellationRequest.requestId,
      };

      await this.transactionRep.updatePaymentStatus(cancellationRequest.paymentId, VtexTransactionStatus.CANCELED);

      const savedTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        PaymentOperation.CANCELLATION,
        cancelResp ? cancelResp.data : null,
      );

      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: cancelResp ? String(cancelResp.data.id) : String(savedTransaction.id),
        code: cancelResp ? String(cancelResp.code) : '0',
        message: cancelResp ? cancelResp.message : 'Cancellation OK',
        requestId: cancellationRequest.requestId,
      };

      await this.recordRep.createRecord(
        cancellationRequest.paymentId,
        PaymentOperation.CANCELLATION,
        cancellationRequest,
        response,
      );
    } catch (e) {
      this.logger.error(
        `Cancellation - Error al Cancelar | paymentId:${cancellationRequest.paymentId}. Error: ${e.message}`,
        e,
      );
      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: null,
        code: 'cancel-manually',
        message: 'Cancellation should be done manually',
        requestId: cancellationRequest.requestId,
      };
      await this.recordRep.createRecord(
        cancellationRequest.paymentId,
        PaymentOperation.CANCELLATION,
        cancellationRequest,
        e,
      );
    }
    this.logger.log(`Cancellation - Terminada OK | paymentId:${cancellationRequest.paymentId}`);
    return response;
  }

  async refund(refundReq: RefundRequestDTO, commerceSession: string): Promise<RefundResponseDTO> {
    let response: RefundResponseDTO;
    let refundResp: CoreResponse;
    this.logger.log(`Refund - Iniciando... | paymentId:${refundReq.paymentId} - Value: ${refundReq.value}`);
    try {
      //const transactionResult: CoreResponse = await this.walletApiClient.refund(refundReq.paymentId);

      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(refundReq.paymentId);

      if (transaction.status == VtexTransactionStatus.CONFIRMED) {
        refundResp = await this.walletApiClient.refund(transaction.paymentId, transaction.amount, commerceSession);
      }

      const vtexData: VtexRequestDto = {
        orderId: refundResp.data.id,
        paymentId: refundReq.paymentId,
        requestId: refundReq.requestId,
        settleId: refundReq.settleId,
        value: refundReq.value,
      };

      const savedTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        PaymentOperation.REFUND,
        refundResp.data,
      );

      response = {
        paymentId: refundReq.paymentId,
        refundId: refundResp ? String(refundResp.data.id) : String(savedTransaction.id),
        value: refundReq.value,
        code: refundResp ? String(refundResp.code) : '0',
        message: refundResp ? refundResp.message : 'Sucessfully refunded',
        requestId: refundReq.requestId,
      };
    } catch (e) {
      this.logger.error(`Refund - Error en Refund | paymentId:${refundReq.paymentId}. Error: ${e.message}`, e.stack);
      response = {
        paymentId: refundReq.paymentId,
        refundId: null,
        code: 'ERR123',
        value: 0,
        message: 'Refund has failed due to an internal error',
        requestId: refundReq.requestId,
      };
    }

    await this.recordRep.createRecord(refundReq.paymentId, PaymentOperation.REFUND, refundReq, response);
    this.logger.log(`Refund - Terminado OK| paymentId:${refundReq.paymentId}`);
    return response;
  }

  async settlements(settlementReq: SettlementsRequestDTO): Promise<SettlementsResponseDTO> {
    let response: SettlementsResponseDTO;
    this.logger.log(`Settlements - Iniciada | paymentId:${settlementReq.paymentId}`);
    try {
      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(settlementReq.paymentId);

      // if(settlementReq.value == )

      const transactionResult: CoreResponse = await this.walletApiClient.settlement(settlementReq.paymentId);

      const vtexData: VtexRequestDto = {
        orderId: transactionResult.data.id,
        paymentId: settlementReq.paymentId,
        requestId: settlementReq.requestId,
        settleId: settlementReq.settleId,
        value: settlementReq.value,
      };

      await this.transactionRep.saveTransaction(vtexData, PaymentOperation.SETTLEMENT, transactionResult);

      response = {
        paymentId: settlementReq.paymentId,
        settleId: String(transactionResult.data.id),
        value: transactionResult.data.amount,
        code: String(transactionResult.code),
        message: 'Sucessfully settled',
        requestId: settlementReq.requestId,
      };
    } catch (e) {
      this.logger.error(
        `Settlements - Error en Settlement | paymentId:${settlementReq.paymentId} - Error: ${e.message}`,
        e,
      );
      response = {
        paymentId: settlementReq.paymentId,
        settleId: null,
        code: 'cancel-manually',
        value: settlementReq.value,
        message: 'Cancellation should be done manually',
        requestId: settlementReq.requestId,
      };
    }

    await this.recordRep.createRecord(settlementReq.paymentId, PaymentOperation.SETTLEMENT, settlementReq, response);
    this.logger.log(`Settlements - Terminado OK| paymentId:${settlementReq.paymentId}`);
    return response;
  }
}
