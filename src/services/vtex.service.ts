import { WalletApiClient } from '../client/wallet-api.client';
import { PaymentRequestDTO } from '../interfaces/wallet/payment-request.dto';
import { PaymentResponseDto } from '../interfaces/wallet/payment-response.dto';
import { envConfig } from '../config';
import { CancellationRequestDTO, CancellationResponseDTO } from '../interfaces/wallet/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO } from '../interfaces/wallet/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO } from '../interfaces/wallet/refund.dto';
import { VtexRecordRepository } from '../repository/vtex-record.repository';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { getVtexStatus, PaymentOperation, PaymentStatus, VtexStatus } from '../interfaces/enums/vtex.enum';
import { ResponseDTO } from '../interfaces/wallet/api-response.dto';
import { VtexPaymentRepository } from '../repository/vtex-payment.repository';
import { PaymentTransactionDto } from '../interfaces/dto/payment-transaction.dto';
import { PaymentDto } from '../interfaces/dto/payment.dto';
import {
  CoreResponse,
  CoreTransactionReq,
  CoreTransactionRes,
  TransactionStatus,
} from '../interfaces/dto/core-transaction.dto';
import { VtexTransactionFlowRepository } from '../repository/vtex-transaction-flow.repository';
import { VtexWalletPaymentRepository } from '../repository/vtex-wallet-payment.repository';
import { WalletPaymentDto } from '../interfaces/dto/wallet-payment.dto';

@Injectable()
export class VtexService {
  constructor(
    private walletApiClient: WalletApiClient,
    private recordRepository: VtexRecordRepository,
    private paymentRepository: VtexPaymentRepository,
    private walletRepository: VtexWalletPaymentRepository,
    private transactionFlowRepository: VtexTransactionFlowRepository,
    private readonly logger: Logger,
  ) {}

  async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
    let payment: PaymentDto;
    let response: PaymentResponseDto;
    try {
      this.logger.log(`Payment - Iniciando... | paymentId:${paymentRequest.paymentId}`);

      payment = await this.paymentRepository.getPayment(paymentRequest.paymentId);
      if (!payment) {
        const paymentData: PaymentDto = {
          orderId: paymentRequest.orderId,
          paymentId: paymentRequest.paymentId,
          amount: paymentRequest.value,
          clientEmail: paymentRequest.miniCart.buyer.email,
          merchantName: paymentRequest.merchantName,
          callbackUrl: paymentRequest.callbackUrl,
          status: PaymentStatus.INIT,
        };

        //TODO: FIX PARA BUG DE VTEX EN PREPROD
        if (envConfig.environment == 'staging')
          paymentData.callbackUrl = paymentRequest.callbackUrl.replace(
            'jumbo.vtexpayments.com.br',
            'jumboprepro.vtexpayments.com.br',
          );
        //TODO: FIN FIX

        payment = await this.paymentRepository.createInitPayment(paymentData);
      }

      const vtexStatus: VtexStatus = getVtexStatus(payment.status);

      response = {
        acquirer: null,
        authorizationId: payment.status == PaymentStatus.APPROVED ? payment.authorizationId : null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: String(payment.id),
        paymentId: payment.paymentId,
        status: vtexStatus,
        tid: String(payment.id),
        code: String(0),
        message:
          vtexStatus == VtexStatus.UNDEFINED
            ? 'Waiting for Confirmation'
            : vtexStatus == VtexStatus.APPROVED
            ? 'Transaction Approved'
            : 'Transaction Denied',
      };

      await this.recordRepository.createRecord(
        paymentRequest.paymentId,
        PaymentOperation.PAYMENT,
        paymentRequest,
        response,
      );
      this.logger.log(`Payment - Terminado | paymentId:${paymentRequest.paymentId} - status: ${response.status}`);
      return response;
    } catch (e) {
      await this.recordRepository.createRecord(
        paymentRequest.paymentId,
        PaymentOperation.PAYMENT,
        paymentRequest,
        e.stack,
      );
      this.logger.error(
        `Payment - Error al ejecutar Payment | paymentId:${paymentRequest.paymentId} - Error:${e.message}`,
        e.stack,
      );
      throw e;
    }
  }

  async paymentConfirmation(paymentId: string, commerceSession: string): Promise<ResponseDTO<null>> {
    const payment: PaymentDto = await this.paymentRepository.getPayment(paymentId);
    if (payment.status != PaymentStatus.INIT) {
      throw new InternalServerErrorException('Estado de Payment invalido');
    }

    this.logger.log(`Confirmation - Iniciando... | paymentId:${paymentId}`);

    try {
      const paymentWalletReq: CoreTransactionReq = {
        amount: payment.amount,
        orderId: payment.orderId,
      };

      //Ejecutando pago en Core Wallet
      const paymentWalletRes: CoreResponse = await this.walletApiClient.payment(
        paymentWalletReq,
        'JUMBO', //vtexTransaction.merchantName, //TODO: Ver esto
        commerceSession,
      );
      if (paymentWalletRes.code != 0) throw new InternalServerErrorException(paymentWalletRes.message);

      const paymentData: CoreTransactionRes = paymentWalletRes.data;

      //Guardando Informacion de Pago Wallet
      const walletPayment: WalletPaymentDto = {
        amount: paymentData.amount,
        coreId: paymentData.id,
        operationType: PaymentOperation.PAYMENT,
        paymentId: paymentId,
      };
      await this.walletRepository.savePayment(walletPayment);

      //Guardando Informacion de Transaccion
      const transactionInfo: PaymentTransactionDto = {
        amount: payment.amount,
        authorizationId: paymentData.authorizationCode,
        operationType: PaymentOperation.CONFIRMATION,
        paymentId: payment.paymentId,
      };

      await this.transactionFlowRepository.saveTransaction(transactionInfo);

      //Actualizando estado de Pago
      await this.paymentRepository.updatePayment({
        paymentId: paymentId,
        status: paymentData.status == TransactionStatus.APPROVED ? PaymentStatus.APPROVED : PaymentStatus.DENIED,
        coreId: paymentData.id,
      });

      //Creando registro de evento
      await this.recordRepository.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, {
        code: paymentWalletRes.code,
        message: paymentWalletRes.message,
      });

      //Enviando callback a Vtex
      const callbackBody: PaymentResponseDto = {
        acquirer: null, // paymentRequest.card.holder || 'VTEX',
        authorizationId: paymentData.status == TransactionStatus.APPROVED ? paymentData.authorizationCode : null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: String(payment.id),
        paymentId: paymentId,
        status: paymentData.status == TransactionStatus.APPROVED ? VtexStatus.APPROVED : VtexStatus.DENIED,
        tid: String(payment.id),
        paymentUrl: payment.callbackUrl,
        code: String(paymentWalletRes.code),
        message: paymentWalletRes.message,
      };
      this.logger.log(`Confirmation - Enviando respuesta a VTEX | paymentId:${paymentId}`);
      await this.walletApiClient.callback(payment.callbackUrl, callbackBody);

      return { code: paymentWalletRes.code, message: paymentWalletRes.message };
    } catch (e) {
      this.logger.error(
        `Confirmation - Error al ejecutar Async Payment | paymentId:${paymentId}. Error: ${e.message}`,
        e,
      );
      await this.recordRepository.createRecord(paymentId, PaymentOperation.CONFIRMATION, paymentId, e.stack);
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

    const payment: PaymentDto = await this.paymentRepository.getPayment(cancellationRequest.paymentId);

    if (payment.status == PaymentStatus.CANCELED) {
      return {
        paymentId: cancellationRequest.paymentId,
        cancellationId: null,
        code: '1',
        message: 'Payment ya se encuentra cancelado',
        requestId: cancellationRequest.requestId,
      };
    } else if (payment.status == PaymentStatus.APPROVED) {
      //Se obtienen todos los pagos asociados a paymentId y se cancelan (quedan en 0)
      for (const wp of payment.walletPayments) {
        if (wp.amount > 0) {
          cancelResp = await this.walletApiClient.refund(wp.coreId, wp.amount, payment.merchantName, commerceSession);
          if (cancelResp.code != 0) throw new InternalServerErrorException(cancelResp.message);
          await this.walletRepository.updatePayment(wp.coreId, 0);
        }
      }
    }

    try {
      const transactionData: PaymentTransactionDto = {
        amount: payment.amount,
        authorizationId: cancelResp?.data.authorizationCode || undefined,
        operationType: PaymentOperation.CANCELLATION,
        paymentId: cancellationRequest.paymentId,
      };
      const savedTransaction = await this.transactionFlowRepository.saveTransaction(transactionData);

      await this.paymentRepository.updatePayment({
        paymentId: cancellationRequest.paymentId,
        status: PaymentStatus.CANCELED,
      });

      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: cancelResp ? String(cancelResp.data.id) : String(savedTransaction.id),
        code: cancelResp ? String(cancelResp.code) : '0',
        message: cancelResp ? cancelResp.message : 'Cancellation OK',
        requestId: cancellationRequest.requestId,
      };

      await this.recordRepository.createRecord(
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
      await this.recordRepository.createRecord(
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
      const payment: PaymentDto = await this.paymentRepository.getPayment(refundReq.paymentId);

      this.valideActiveStatus(payment);

      //Se realiza refund
      const newAmount = payment.amount - refundReq.value;
      await this.updatePaymentAmount(payment, newAmount, commerceSession);

      const transactionData: PaymentTransactionDto = {
        operationType: PaymentOperation.REFUND,
        paymentId: refundReq.paymentId,
        requestId: refundReq.requestId,
        settleId: refundReq.settleId,
        amount: refundReq.value,
        authorizationId: refundResp?.data.authorizationCode,
      };

      const savedTransaction: PaymentTransactionDto = await this.transactionFlowRepository.saveTransaction(
        transactionData,
      );

      response = {
        paymentId: refundReq.paymentId,
        refundId: refundResp ? String(refundResp.data.id) : String(savedTransaction.id),
        value: newAmount,
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

    await this.recordRepository.createRecord(refundReq.paymentId, PaymentOperation.REFUND, refundReq, response);
    this.logger.log(`Refund - Terminado OK| paymentId:${refundReq.paymentId}`);
    return response;
  }

  async settlements(request: SettlementsRequestDTO, commerceSession: string): Promise<SettlementsResponseDTO> {
    let response: SettlementsResponseDTO;
    this.logger.log(`Settlements - Iniciada | paymentId:${request.paymentId} - Settlement Value:${request.value}`);
    try {
      const payment: PaymentDto = await this.paymentRepository.getPayment(request.paymentId);
      this.valideActiveStatus(payment);

      if (request.value != payment.amount) {
        this.logger.log(`Settlements - Actualizando Amount final :${payment.amount}`);
        await this.updatePaymentAmount(payment, request.value, commerceSession);
      }

      const transactionData: PaymentTransactionDto = {
        operationType: PaymentOperation.SETTLEMENT,
        paymentId: request.paymentId,
        requestId: request.requestId,
        settleId: request.settleId,
        amount: request.value,
        authorizationId: request.authorizationId,
      };

      await this.transactionFlowRepository.saveTransaction(transactionData);

      await this.paymentRepository.updatePayment({
        paymentId: request.paymentId,
        amount: request.value,
        status: PaymentStatus.SETTLED,
      });

      response = {
        paymentId: request.paymentId,
        settleId: request.settleId,
        value: request.value,
        code: '0',
        message: 'Sucessfully settled',
        requestId: request.requestId,
      };
    } catch (e) {
      this.logger.error(`Settlements - Error en Settlement | paymentId:${request.paymentId} - Error: ${e.message}`, e);
      response = {
        paymentId: request.paymentId,
        settleId: null,
        code: 'cancel-manually',
        value: request.value,
        message: 'Cancellation should be done manually',
        requestId: request.requestId,
      };
    }

    await this.recordRepository.createRecord(request.paymentId, PaymentOperation.SETTLEMENT, request, response);
    this.logger.log(`Settlements - Terminado OK| paymentId:${request.paymentId}`);
    return response;
  }

  async updatePaymentAmount(payment: PaymentDto, newAmount: number, commerceSession): Promise<void> {
    if (newAmount < payment.amount) {
      //Caso de Refund
      let totalRefunded = newAmount;
      for (const wp of payment.walletPayments) {
        if (totalRefunded <= wp.amount && wp.amount > 0) {
          //Refund reduce un pago.
          const refundResp = await this.walletApiClient.refund(
            wp.coreId,
            totalRefunded,
            payment.merchantName,
            commerceSession,
          );
          if (refundResp.code != 0) throw new InternalServerErrorException(refundResp.message);
          await this.walletRepository.updatePayment(wp.coreId, wp.amount - totalRefunded);
          break;
        } else if (totalRefunded > wp.amount && wp.amount > 0) {
          //Refun reduce un pago completo
          const refundResp = await this.walletApiClient.refund(
            wp.coreId,
            wp.amount,
            payment.merchantName,
            commerceSession,
          );
          if (refundResp.code != 0) throw new InternalServerErrorException(refundResp.message);
          await this.walletRepository.updatePayment(wp.coreId, 0);
          totalRefunded -= wp.amount;
        }
      }
    } else if (newAmount > payment.amount) {
      //Caso para uppselling
      const newPaymentAmount = newAmount - payment.amount;
      const paymentWalletReq: CoreTransactionReq = {
        amount: newPaymentAmount,
        orderId: payment.orderId,
      };
      //Ejecutando pago en Core Wallet
      const paymentWalletRes: CoreResponse = await this.walletApiClient.payment(
        paymentWalletReq,
        'JUMBO', //vtexTransaction.merchantName, //TODO: Ver esto
        commerceSession,
      );
      if (paymentWalletRes.code != 0) throw new InternalServerErrorException(paymentWalletRes.message);

      //Guardando Informacion de Pago Wallet
      const walletPayment: WalletPaymentDto = {
        amount: newPaymentAmount,
        coreId: paymentWalletRes.data.id,
        operationType: PaymentOperation.PAYMENT,
        paymentId: payment.paymentId,
      };
      await this.walletRepository.savePayment(walletPayment);
    }

    await this.paymentRepository.updatePayment({
      amount: newAmount,
      paymentId: payment.paymentId,
    });
  }

  private valideActiveStatus(tx: PaymentDto): void {
    if (tx.status != PaymentStatus.APPROVED && tx.status != PaymentStatus.SETTLED) {
      throw new InternalServerErrorException(`Invalid Transaction. Payment Status: ${tx.status}`);
    }
  }
}
