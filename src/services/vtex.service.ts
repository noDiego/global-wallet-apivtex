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
import { UpdatePaymentResult, WalletPaymentDto } from '../interfaces/dto/wallet-payment.dto';
import { v4 as uuidv4 } from 'uuid';
import { CommerceRepository } from '../repository/commerce.repository';
import { CommerceDto } from '../interfaces/dto/commerce.dto';

@Injectable()
export class VtexService {
  private logger = new Logger('VtexService');

  constructor(
    private walletApiClient: WalletApiClient,
    private commerceRepository: CommerceRepository,
    private paymentRepository: VtexPaymentRepository,
    private recordRepository: VtexRecordRepository,
    private walletRepository: VtexWalletPaymentRepository,
    private transactionFlowRepository: VtexTransactionFlowRepository,
  ) {}

  //Solo se genera en BD local
  async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
    let payment: PaymentDto;
    let response: PaymentResponseDto;
    try {
      this.logger.log(`PaymentId:${paymentRequest.paymentId} | Payment - Iniciando...`);

      payment = await this.paymentRepository.getPayment(paymentRequest.paymentId);
      if (!payment) {
        const paymentData: PaymentDto = {
          orderId: paymentRequest.orderId,
          reference: paymentRequest.reference,
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
      response = {
        acquirer: null,
        authorizationId: payment.status == PaymentStatus.APPROVED ? payment.walletPayments[0].authorizationId : null,
        delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
        delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
        delayToCancel: envConfig.vtex.development.delayToCancel,
        nsu: payment.id,
        paymentId: payment.paymentId,
        status: getVtexStatus(payment.status),
        tid: payment.id,
        code: String(0),
        message:
          getVtexStatus(payment.status) == VtexStatus.UNDEFINED
            ? 'Waiting for Confirmation'
            : getVtexStatus(payment.status) == VtexStatus.APPROVED
            ? 'Transaction Approved'
            : 'Transaction Denied',
      };

      this.recordRepository.createRecord({
        operationType: PaymentOperation.PAYMENT,
        paymentId: paymentRequest.paymentId,
        requestData: paymentRequest,
        responseData: response,
      });

      this.logger.log(`PaymentId:${paymentRequest.paymentId} | Payment - Terminado | status: ${response.status}`);
      return response;
    } catch (e) {
      this.recordRepository.createRecord({
        operationType: PaymentOperation.PAYMENT,
        paymentId: paymentRequest.paymentId,
        requestData: paymentRequest,
        responseData: e.stack,
      });
      this.logger.error(
        `PaymentId:${paymentRequest.paymentId} | Payment - Error al ejecutar Payment | Error:${e.message}`,
        e.stack,
      );
      throw e;
    }
  }

  //Se comunica con Wallet y genera el pago
  async paymentConfirmation(paymentId: string, commerceSession: string, commerceToken: string): Promise<CoreResponse> {
    const payment: PaymentDto = await this.getPayment(paymentId);
    let response;
    if (payment.status != PaymentStatus.INIT) {
      throw new InternalServerErrorException(`PaymentId:${paymentId} | Estado de Payment invalido`);
    }
    const commerce: CommerceDto = await this.commerceRepository.getCommerceByToken(commerceToken);

    this.logger.log(`PaymentId:${paymentId} | Confirmation - Iniciando...`);

    try {
      const paymentWalletReq: CoreTransactionReq = {
        amount: payment.amount,
        orderId: payment.reference, //Se utliza reference en lugar de orderId para facilitar seguimiento
      };

      //Ejecutando pago en Core Wallet
      const paymentWalletRes: CoreResponse = await this.walletApiClient.payment(
        paymentWalletReq,
        commerce.token,
        commerceSession,
      );
      if (paymentWalletRes.code != 0) throw new InternalServerErrorException(paymentWalletRes.message);

      const paymentData: CoreTransactionRes = paymentWalletRes.data;

      //Guardando Informacion de Pago Wallet
      const walletPayment: WalletPaymentDto = {
        amount: paymentData.amount,
        authorizationId: paymentData.authorizationCode,
        coreId: paymentData.id,
        operationType: PaymentOperation.PAYMENT,
        paymentId: paymentId,
      };
      this.walletRepository.savePayment(walletPayment);

      //Guardando Informacion de Transaccion
      const transactionInfo: PaymentTransactionDto = {
        amount: payment.amount,
        authorizationId: paymentData.authorizationCode,
        operationType: PaymentOperation.CONFIRMATION,
        paymentId: payment.paymentId,
      };

      this.transactionFlowRepository.saveTransaction(transactionInfo);

      //Actualizando estado de Pago
      this.paymentRepository.updatePayment({
        paymentId: paymentId,
        status: paymentData.status == TransactionStatus.APPROVED ? PaymentStatus.APPROVED : PaymentStatus.DENIED,
        coreId: paymentData.id,
        commerceId: commerce.id,
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
        code: String(paymentWalletRes.code),
        message: paymentWalletRes.message,
      };
      this.logger.log(`PaymentId:${paymentId} | Confirmation - Enviando respuesta a VTEX`);
      this.sendVtexCallback(payment, callbackBody, commerce);
      //Fin Callback

      paymentWalletRes.data.status = callbackBody.status;
      response = paymentWalletRes;
    } catch (e) {
      this.logger.error(
        `PaymentId:${paymentId} | Confirmation - Error al ejecutar Async Payment | Error: ${e.message}`,
        e,
      );
      response = { code: -1, message: 'Error: ' + e.message };
    }
    //Creando registro de evento
    this.recordRepository.createRecord({
      operationType: PaymentOperation.CONFIRMATION,
      paymentId: paymentId,
      requestData: paymentId,
      responseData: response,
    });
    return response;
  }

  async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {
    let response: CancellationResponseDTO;
    let cancelResp: CoreResponse;

    this.logger.log(`PaymentId:${cancellationRequest.paymentId} | Cancellation - Iniciada`);

    const payment: PaymentDto = await this.getPayment(cancellationRequest.paymentId);

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
          cancelResp = await this.walletApiClient.refund(wp.coreId, wp.amount, payment.commerce.token);
          if (cancelResp.code != 0) throw new InternalServerErrorException(cancelResp.message);
          await this.walletRepository.updateWalletPayment(wp.coreId, 0);
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
      this.transactionFlowRepository.saveTransaction(transactionData);

      this.paymentRepository.updatePayment({
        paymentId: cancellationRequest.paymentId,
        status: PaymentStatus.CANCELED,
      });

      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: String(cancelResp?.data.id) || '0',
        code: cancelResp ? String(cancelResp.code) : '0',
        message: cancelResp ? cancelResp.message : 'Cancellation OK',
        requestId: cancellationRequest.requestId,
      };
    } catch (e) {
      this.logger.error(
        `PaymentId:${cancellationRequest.paymentId} | Cancellation - Error al Cancelar. Error: ${e.message}`,
        e,
      );
      response = {
        paymentId: cancellationRequest.paymentId,
        cancellationId: null,
        code: 'cancel-manually',
        message: 'Cancellation should be done manually',
        requestId: cancellationRequest.requestId,
      };
    }
    this.recordRepository.createRecord({
      operationType: PaymentOperation.CANCELLATION,
      paymentId: cancellationRequest.paymentId,
      requestData: cancellationRequest,
      responseData: response,
    });
    this.logger.log(
      `PaymentId:${cancellationRequest.paymentId} | Cancellation - Terminada ${
        response.code == 'cancel-manually' ? 'con Error' : 'OK'
      }`,
    );
    return response;
  }

  async refund(refundReq: RefundRequestDTO): Promise<RefundResponseDTO> {
    let response: RefundResponseDTO;
    this.logger.log(`PaymentId:${refundReq.paymentId} | Refund - Iniciando... - Value: ${refundReq.value}`);
    try {
      const payment: PaymentDto = await this.getPayment(refundReq.paymentId);
      this.valideActiveStatus(payment);

      //Se realiza refund
      const newAmount = payment.amount - refundReq.value;
      const updateResult: UpdatePaymentResult = await this.updatePaymentAmount(
        payment,
        newAmount,
        payment.commerce.token,
      );

      const transactionData: PaymentTransactionDto = {
        operationType: PaymentOperation.REFUND,
        paymentId: refundReq.paymentId,
        requestId: refundReq.requestId,
        settleId: refundReq.settleId,
        amount: refundReq.value,
        authorizationId: updateResult?.authorizationCode,
      };

      this.transactionFlowRepository.saveTransaction(transactionData);

      response = {
        paymentId: refundReq.paymentId,
        refundId: String(updateResult.refundId),
        value: newAmount,
        code: String(updateResult.responseCode),
        message: updateResult ? updateResult.responseMessage : 'Sucessfully refunded',
        requestId: refundReq.requestId,
      };
    } catch (e) {
      this.logger.error(`PaymentId:${refundReq.paymentId} | Refund - Error en Refund. Error: ${e.message}`, e.stack);
      response = {
        paymentId: refundReq.paymentId,
        refundId: null,
        code: 'ERR',
        value: 0,
        message: 'Refund has failed due to an internal error',
        requestId: refundReq.requestId,
      };
    }
    this.recordRepository.createRecord({
      operationType: PaymentOperation.REFUND,
      paymentId: refundReq.paymentId,
      requestData: refundReq,
      responseData: response,
    });
    this.logger.log(
      `PaymentId:${refundReq.paymentId} | Refund - Terminado ${response.code == 'ERR' ? 'con Error' : 'OK'}`,
    );
    return response;
  }

  async settlements(request: SettlementsRequestDTO): Promise<SettlementsResponseDTO> {
    const settleId = request.settleId || uuidv4(); //En algunos calls no viene el settleId
    let response: SettlementsResponseDTO;
    this.logger.log(`PaymentId:${request.paymentId} | Settlements - Iniciada - Value:${request.value}`);
    try {
      const payment: PaymentDto = await this.getPayment(request.paymentId);
      this.valideActiveStatus(payment);

      if (request.value != payment.amount) {
        this.logger.log(`PaymentId:${request.paymentId} | Settlements - Actualizando Amount final :${payment.amount}`);
        await this.updatePaymentAmount(payment, request.value, payment.commerce.token);
      }

      const transactionData: PaymentTransactionDto = {
        operationType: PaymentOperation.SETTLEMENT,
        paymentId: request.paymentId,
        requestId: request.requestId,
        settleId: settleId,
        amount: request.value,
        authorizationId: request.authorizationId,
      };

      this.transactionFlowRepository.saveTransaction(transactionData);

      this.paymentRepository.updatePayment({
        paymentId: request.paymentId,
        amount: request.value,
        status: PaymentStatus.SETTLED,
      });

      response = {
        paymentId: request.paymentId,
        settleId: settleId,
        value: request.value,
        code: '0',
        message: 'Sucessfully settled',
        requestId: request.requestId,
      };
    } catch (e) {
      this.logger.error(`PaymentId:${request.paymentId} | Settlements - Error en Settlement | Error: ${e.message}`, e);
      response = {
        paymentId: request.paymentId,
        settleId: null,
        code: 'settlement-error',
        value: request.value,
        message: e.message,
        requestId: request.requestId,
      };
    }
    this.recordRepository.createRecord({
      operationType: PaymentOperation.SETTLEMENT,
      paymentId: request.paymentId,
      requestData: request,
      responseData: response,
    });
    this.logger.log(
      `PaymentId:${request.paymentId} | Settlements - Terminado ${response.code != '0' ? 'con Error' : 'OK'}`,
    );
    return response;
  }

  private sendVtexCallback(payment: PaymentDto, callbackBody: PaymentResponseDto, commerce: CommerceDto) {
    this.walletApiClient.callback(payment.callbackUrl, callbackBody, commerce).then(
      (r) => {
        this.logger.log(`PaymentId:${payment.paymentId} | Confirmation - Callback Response Status: ${r.status}`);
        this.recordRepository.createRecord({
          operationType: PaymentOperation.CALLBACK,
          paymentId: payment.paymentId,
          requestData: callbackBody,
          responseData: r,
        });
      },
      (e) => {
        this.logger.error(`PaymentId:${payment.paymentId} | Confirmation - Callback FAILED - Exception: ${e}`);
        this.recordRepository.createRecord({
          operationType: PaymentOperation.CALLBACK,
          paymentId: payment.paymentId,
          requestData: callbackBody,
          responseData: e.data || e,
        });
      },
    );
  }

  private async updatePaymentAmount(
    payment: PaymentDto,
    newAmount: number,
    commerceToken: string,
  ): Promise<UpdatePaymentResult> {
    let operationResponse: CoreResponse;
    if (newAmount < payment.amount) {
      //Caso de Refund
      let refundAmount = newAmount;
      for (const wp of payment.walletPayments) {
        if (refundAmount <= wp.amount && wp.amount > 0) {
          //Refund reduce un pago.
          operationResponse = await this.walletApiClient.refund(wp.coreId, wp.amount - refundAmount, commerceToken);
          if (operationResponse.code != 0) throw new InternalServerErrorException(operationResponse.message);
          this.walletRepository.updateWalletPayment(wp.coreId, refundAmount);
          break;
        } else if (refundAmount > wp.amount && wp.amount > 0) {
          //Refun reduce un pago completo
          operationResponse = await this.walletApiClient.refund(wp.coreId, wp.amount, commerceToken);
          if (operationResponse.code != 0) throw new InternalServerErrorException(operationResponse.message);
          this.walletRepository.updateWalletPayment(wp.coreId, 0);
          refundAmount -= wp.amount;
        }
      }
    } else if (newAmount > payment.amount) {
      //Caso para uppselling
      const newPaymentAmount = newAmount - payment.amount;
      const paymentWalletReq: CoreTransactionReq = {
        amount: newPaymentAmount,
        orderId: payment.orderId,
        email: payment.clientEmail,
      };
      //Ejecutando pago en Core Wallet
      const parentId = payment.walletPayments[0].coreId; //Id de Pago original usado para generar un upselling
      operationResponse = await this.walletApiClient.upselling(paymentWalletReq, parentId, commerceToken);
      if (operationResponse.code != 0) throw new InternalServerErrorException(operationResponse.message);

      //Guardando Informacion de Pago Wallet
      const walletPayment: WalletPaymentDto = {
        amount: newPaymentAmount,
        authorizationId: operationResponse.data.authorizationCode,
        coreId: operationResponse.data.id,
        operationType: PaymentOperation.PAYMENT,
        paymentId: payment.paymentId,
      };
      this.walletRepository.savePayment(walletPayment);
    }

    this.paymentRepository.updatePayment({
      amount: newAmount,
      paymentId: payment.paymentId,
    });

    return {
      authorizationCode: operationResponse.data.authorizationCode,
      refundId: operationResponse.data.id,
      responseCode: operationResponse.code,
      responseMessage: operationResponse.message,
    };
  }

  private async getPayment(paymentId: string) {
    const payment: PaymentDto = await this.paymentRepository.getPayment(paymentId);
    if (!payment) throw new InternalServerErrorException(`Payment: ${payment.paymentId}. Not Found.`);
    return payment;
  }

  private valideActiveStatus(payment: PaymentDto): void {
    if (payment.status != PaymentStatus.APPROVED && payment.status != PaymentStatus.SETTLED) {
      throw new InternalServerErrorException(`Invalid Transaction. Incorrect Payment status`);
    }
  }
}
