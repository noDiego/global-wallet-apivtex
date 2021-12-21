import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { PaymentRequestDTO } from '../../application/dto/payment-request.dto';
import { PaymentResponseDto } from '../../application/dto/payment-response.dto';
import { envConfig } from '../../config';
import { CancellationRequestDTO, CancellationResponseDTO } from '../../application/dto/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../../application/dto/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../../application/dto/refund.dto';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentOperation, VtexStatus } from '../../infrastructure/enums/vtex.enum';
import { ResponseDTO } from '../../application/dto/api-response.dto';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';
import { VtexRequestDto } from '../../application/dto/vtex-request.dto';
import { VtexTransactionDto } from '../../infrastructure/dto/vtex-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { sleep, validateCardNumber } from '../../utils/validation';
import { CoreTransactionRes, TransactionStatus } from '../../infrastructure/dto/core-transaction.dto';

@Injectable()
export class VtexDefaultService {
  constructor(
    private walletApiClient: WalletApiClient,
    private recordRep: VtexRecordRepository,
    private transactionRep: VtexTransactionRepository,
    private readonly logger: Logger,
  ) {}

  async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
    try {
      this.logger.log(`Payment - Iniciando... | paymentId:${paymentRequest.paymentId}`);
      let validCard: boolean = validateCardNumber(paymentRequest.card?.number);
      if (paymentRequest.card?.number == '4222222222222224') {
        //Caso de prueba Approved de vtex
        validCard = true;
      }

      let pagoPendiente = false; //Para simulacion de pago asincrono

      //Simular Pago

      if (paymentRequest.card?.number.includes('422222222222222')) {
        pagoPendiente = true;
      }

      const trxResult: CoreTransactionRes = {
        date: new Date(),
        amount: paymentRequest.value,
        authorizationCode: pagoPendiente ? null : validCard ? uuidv4() : null,
        status: TransactionStatus.APPROVED,
        id: validCard ? uuidv4() : null,
      };
      //

      const vtexData: VtexRequestDto = {
        orderId: paymentRequest.orderId,
        paymentId: paymentRequest.paymentId,
        transactionNumber: uuidv4(),
        value: paymentRequest.value,
        clientEmail: paymentRequest.miniCart.buyer.email,
        merchantName: paymentRequest.merchantName,
        callbackUrl: paymentRequest.callbackUrl,
      };

      const vtexTransaction: VtexTransactionDto = await this.transactionRep.saveTransaction(
        vtexData,
        PaymentOperation.PAYMENT,
        trxResult,
        trxResult.id == null,
      );

      const response: PaymentResponseDto = {
        acquirer: 'PP',
        authorizationId: trxResult.authorizationCode,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: vtexTransaction.transactionNumber,
        paymentId: paymentRequest.paymentId,
        status: pagoPendiente ? VtexStatus.UNDEFINED : trxResult.id ? VtexStatus.APPROVED : VtexStatus.DENIED,
        tid: vtexTransaction.transactionNumber,
        paymentUrl: paymentRequest.returnUrl,
        code: String(0),
        message: pagoPendiente ? 'PENDING' : trxResult.id ? 'OK' : 'DENIED',
      };

      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, response);

      if (pagoPendiente) {
        this.paymentConfirmation(paymentRequest.paymentId, paymentRequest.card.number).then(() => {
          this.logger.debug(`Payment - Async Terminado | paymentid:${paymentRequest.paymentId}`);
        });
      }

      this.logger.log(`Payment - Terminado | paymentId:${paymentRequest.paymentId} - status: ${response.status}`);
      return response;
    } catch (e) {
      this.logger.error(
        `Payment - Error al ejecutar Payment | paymentId:${paymentRequest.paymentId}. Error: ${e.message}`,
      );
      await this.recordRep.createRecord(paymentRequest.paymentId, PaymentOperation.PAYMENT, paymentRequest, e);
      throw e;
    }
  }

  async paymentConfirmation(paymentId: string, ccnumber: string): Promise<ResponseDTO<null>> {
    //Credit Card Number guardado para simulacion de
    // datos invalidos

    this.logger.log(`Async Payment - Iniciando... | paymentId:${paymentId}`);

    try {
      await sleep(2000);
      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(paymentId);

      let validCard: boolean = validateCardNumber(ccnumber);
      validCard = ccnumber == '4222222222222224'; //Caso de prueba Approved de vtex

      //Simular Pago
      const trxResult: CoreTransactionRes = {
        date: new Date(),
        status: TransactionStatus.APPROVED,
        amount: transaction.amount,
        authorizationCode: validCard ? uuidv4() : null,
        id: transaction.coreId,
      };
      //

      const response: PaymentResponseDto = {
        acquirer: null,
        authorizationId: trxResult.authorizationCode,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: transaction.transactionNumber,
        paymentId: transaction.paymentId,
        status: trxResult.id ? VtexStatus.APPROVED : VtexStatus.DENIED,
        tid: transaction.transactionNumber,
        paymentUrl: transaction.callbackUrl,
        code: String(0),
        message: trxResult.authorizationCode ? 'OK' : 'DENIED',
      };

      this.logger.log(`AsyncPayment - Enviando respuesta a VTEX | paymentId:${paymentId} - status: ${response.status}`);

      //Retornar datos a callbackurl
      await this.walletApiClient.callback(transaction.callbackUrl, response);
      //

      const vtexData: VtexRequestDto = {
        orderId: trxResult.id ? trxResult.id : null,
        transactionNumber: transaction.transactionNumber,
        paymentId: paymentId,
        value: transaction.amount,
        callbackUrl: transaction.callbackUrl,
      };

      await this.transactionRep.saveTransaction(vtexData, PaymentOperation.CONFIRMATION, trxResult);

      await this.recordRep.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, null);

      this.logger.log(`Async Payment - Terminado | paymentId:${paymentId} `);

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
    let response;
    CancellationResponseDTO;

    this.logger.log(`Cancellation - Iniciada | paymentId:${cancellationRequest.paymentId}`);

    const transaction: VtexTransactionDto = await this.transactionRep.getPayment(cancellationRequest.paymentId);

    //Simular Respuesta
    const trxResult: CoreTransactionRes = {
      amount: transaction.amount,
      date: new Date(),
      status: TransactionStatus.APPROVED,
      authorizationCode: uuidv4(),
      id: uuidv4(),
    };
    //

    try {
      const vtexData: VtexRequestDto = {
        orderId: transaction.orderId,
        transactionNumber: transaction.transactionNumber,
        paymentId: cancellationRequest.paymentId,
        requestId: cancellationRequest.requestId,
      };

      await this.transactionRep.saveTransaction(vtexData, PaymentOperation.CANCELLATION, trxResult);

      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: String(trxResult.id),
        code: 0,
        message: 'OK',
        requestId: cancellationRequest.requestId,
      };
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
    }
    await this.recordRep.createRecord(
      cancellationRequest.paymentId,
      PaymentOperation.CANCELLATION,
      cancellationRequest,
      response,
    );
    this.logger.log(`Cancellation - Terminada OK | paymentId:${cancellationRequest.paymentId}`);
    return response;
  }

  async refund(refundReq: RefundRequestDTO): Promise<RefundResponseDTO> {
    let response: RefundResponseDTO;

    this.logger.log(`Refund - Iniciando... | paymentId:${refundReq.paymentId} - Value: ${refundReq.value}`);

    try {
      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(refundReq.paymentId);

      //Simular Respuesta
      const trxResult: CoreTransactionRes = {
        amount: transaction.amount,
        date: new Date(),
        status: TransactionStatus.APPROVED,
        authorizationCode: uuidv4(),
        id: uuidv4(),
      };
      //

      const vtexData: VtexRequestDto = {
        orderId: transaction.orderId,
        paymentId: refundReq.paymentId,
        requestId: refundReq.requestId,
        settleId: refundReq.settleId,
        value: refundReq.value,
      };

      await this.transactionRep.saveTransaction(vtexData, PaymentOperation.REFUND, trxResult);

      response = {
        paymentId: refundReq.paymentId,
        refundId: String(trxResult.id),
        value: refundReq.value,
        code: '0',
        message: 'Sucessfully refunded',
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
      const transaction: VtexTransactionDto = await this.transactionRep.getPayment(settlementReq.paymentId);

      //Simular Respuesta
      const trxResult: CoreTransactionRes = {
        amount: transaction.amount,
        date: new Date(),
        status: TransactionStatus.APPROVED,
        authorizationCode: uuidv4(),
        id: uuidv4(),
      };

      const vtexData: VtexRequestDto = {
        orderId: trxResult.id,
        paymentId: settlementReq.paymentId,
        requestId: settlementReq.requestId,
        settleId: settlementReq.settleId,
        value: settlementReq.value,
        transactionNumber: transaction.transactionNumber,
      };

      await this.transactionRep.saveTransaction(vtexData, PaymentOperation.SETTLEMENT, trxResult);

      response = {
        paymentId: settlementReq.paymentId,
        settleId: String(trxResult.id),
        value: trxResult.amount,
        code: '0',
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
