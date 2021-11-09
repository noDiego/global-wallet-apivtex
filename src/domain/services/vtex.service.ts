import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { PaymentRequestDTO } from '../../application/dto/payment-request.dto';
import { CreateTransactionDetail } from '../../infrastructure/dto/create-transaction-req.dto';
import { PaymentResponseDto } from '../../application/dto/payment-response.dto';
import { envConfig } from '../../config';
import { CancellationRequestDTO, CancellationResponseDTO } from 'src/application/dto/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../../application/dto/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../../application/dto/refund.dto';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentOperation, TransactionStatus, VtexStatus } from '../../infrastructure/enums/vtex.enum';
import { ResponseDTO } from '../../application/dto/api-response.dto';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';
import { CoreTransactionDto } from '../../infrastructure/dto/core-transaction.dto';
import { VtexRequestDto } from '../../application/dto/vtex-request.dto';
import { VtexTransactionDto } from '../../infrastructure/dto/vtex-transaction.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VtexService {
  constructor(
    private walletApiClient: WalletApiClient,
    private recordRep: VtexRecordRepository,
    private transactionRep: VtexTransactionRepository,
    private readonly logger: Logger,
  ) {}

  async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
    try {
      //const validCard: boolean = validateCardNumber(paymentRequest.card.number);
      this.logger.log(`Payment - Iniciando... | paymentId:${paymentRequest.paymentId}`);

      const vtexData: VtexRequestDto = {
        orderId: paymentRequest.orderId,
        transactionNumber: uuidv4(),
        paymentId: paymentRequest.paymentId,
        value: paymentRequest.value,
        clientEmail: paymentRequest.miniCart.buyer.email,
        merchantName: paymentRequest.merchantName,
        callbackUrl: paymentRequest.callbackUrl,
      };
      const vtexTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        null,
        PaymentOperation.PAYMENT,
      );

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
        message: 'Transaction saved. Waiting for confirmation',
      };

      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, response);
      this.logger.log(`Payment - Terminado | paymentId:${paymentRequest.paymentId} - status: ${response.status}`);
      return response;
    } catch (e) {
      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, e);
      this.logger.error(
        `Payment - Error al ejecutar Payment | paymentId:${paymentRequest.paymentId}. Error: ${e.message}`,
      );
      throw e;
    }
  }

  async paymentConfirmation(paymentId: string): Promise<ResponseDTO<null>> {
    const transaction: VtexTransactionDto = await this.transactionRep.getPayment(paymentId);

    this.logger.log(`Async Payment - Iniciando... | paymentId:${paymentId}`);

    try {
      const paymentWalletReq: CreateTransactionDetail = {
        amount: transaction.amount,
        currency: '',
        orderId: transaction.orderId,
        paymentId: transaction.paymentId,
      };

      const paymentResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.payment(
        paymentWalletReq,
        transaction.merchantName,
      );
      const resultTrx: CoreTransactionDto = paymentResult.data;

      const response: PaymentResponseDto = {
        acquirer: null, // paymentRequest.card.holder || 'VTEX',
        authorizationId: paymentResult.code == 0 ? resultTrx.authorizationCode : null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: transaction.transactionNumber,
        paymentId: paymentId,
        status: paymentResult.code == 0 ? VtexStatus.APPROVED : VtexStatus.DENIED,
        tid: transaction.transactionNumber,
        paymentUrl: transaction.callbackUrl,
        code: String(paymentResult.code),
        message: paymentResult.message,
      };

      const vtexData: VtexRequestDto = {
        orderId: paymentResult.code == 0 ? resultTrx.orderId : null,
        transactionNumber: transaction.transactionNumber,
        paymentId: paymentId,
        value: transaction.amount,
        callbackUrl: transaction.callbackUrl,
      };
      await this.transactionRep.saveTransaction(vtexData, resultTrx, PaymentOperation.CONFIRMATION);

      await this.transactionRep.updatePaymentStatus(paymentId, TransactionStatus.CONFIRMED);

      await this.recordRep.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, null);
      this.logger.log(`AsyncPayment - Enviando respuesta a VTEX | paymentId:${paymentId} - status: ${response.status}`);
      await this.walletApiClient.callback(transaction.callbackUrl, response);

      return { code: 0, message: `paymentId:${paymentId} confirmado OK.` };
    } catch (e) {
      this.logger.error(
        `Async Payment - Error al ejecutar Async Payment | paymentId:${paymentId}. Error: ${e.message}`,
      );
      await this.recordRep.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, e);
      throw e;
    }
  }
  async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {
    let response: CancellationResponseDTO;
    let cancelResp: ResponseDTO<CoreTransactionDto>;

    this.logger.log(`Cancellation - Iniciada | paymentId:${cancellationRequest.paymentId}`);

    const transaction: VtexTransactionDto = await this.transactionRep.getPayment(cancellationRequest.paymentId);

    if (transaction.status == TransactionStatus.CANCELED) {
      return {
        paymentId: cancellationRequest.paymentId,
        cancellationId: null,
        code: '1',
        message: 'Payment ya se encuentra cancelado',
        requestId: cancellationRequest.requestId,
      };
    } else if (transaction.status == TransactionStatus.CONFIRMED) {
      cancelResp = await this.walletApiClient.cancel(transaction.paymentId, cancellationRequest.authorizationId);
    }

    try {
      const vtexData: VtexRequestDto = {
        orderId: cancelResp.data.orderId,
        transactionNumber: transaction.transactionNumber,
        paymentId: cancellationRequest.paymentId,
        requestId: cancellationRequest.requestId,
      };

      await this.transactionRep.updatePaymentStatus(cancellationRequest.paymentId, TransactionStatus.CANCELED);

      const savedTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        cancelResp ? cancelResp.data : null,
        PaymentOperation.CANCELLATION,
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

  async refund(refundReq: RefundRequestDTO): Promise<RefundResponseDTO> {
    let response: RefundResponseDTO;
    let refundResp: ResponseDTO<CoreTransactionDto>;
    this.logger.log(`Refund - Iniciando... | paymentId:${refundReq.paymentId} - Value: ${refundReq.value}`);
    try {
      //const transactionResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.refund(refundReq.paymentId);

      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(refundReq.paymentId);

      if (transaction.status == TransactionStatus.CONFIRMED) {
        refundResp = await this.walletApiClient.refund(transaction.paymentId, transaction.amount);
      }

      const vtexData: VtexRequestDto = {
        orderId: refundResp.data.orderId,
        paymentId: refundReq.paymentId,
        requestId: refundReq.requestId,
        settleId: refundReq.settleId,
        value: refundReq.value,
      };

      const savedTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        refundResp.data,
        PaymentOperation.REFUND,
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
      this.logger.error(`Refund - Error en Refund | paymentId:${refundReq.paymentId}. Error: ${e.message}`);
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
      // const transactionResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.settlement(settlementReq.paymentId);
      //DUMMY
      const resultTrx: CoreTransactionDto = {
        amount: 0,
        authorizationCode: 'AUTH-004',
        balance: 0,
        creditNoteId: '',
        date: new Date(),
        dni: '257969045',
        email: 'andjos27@gmail.com',
        id: 'CORE-004',
        orderId: 'ORDER-001',
        origin: '',
        type: 'PCE',
      };
      const transactionResult: ResponseDTO<CoreTransactionDto> = {
        code: 0,
        data: resultTrx,
        message: 'OK',
      };
      //FIN DUMMY

      const vtexData: VtexRequestDto = {
        orderId: resultTrx.orderId,
        paymentId: settlementReq.paymentId,
        requestId: settlementReq.requestId,
        settleId: settlementReq.settleId,
        value: settlementReq.value,
      };

      await this.transactionRep.saveTransaction(vtexData, resultTrx, PaymentOperation.SETTLEMENT);

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
