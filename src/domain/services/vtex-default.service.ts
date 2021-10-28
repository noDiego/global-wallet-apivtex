import { WalletApiClient } from '../../infrastructure/client/wallet-api.client';
import { PaymentRequestDTO } from '../../application/dto/payment-request.dto';
import { CreateTransactionDetail } from '../../infrastructure/dto/createTransactionReq.dto';
import { PaymentResponseDto } from '../../application/dto/payment-response.dto';
import { envConfig } from '../../config';
import { CancellationRequestDTO, CancellationResponseDTO, } from 'src/application/dto/cancellation.dto';
import { SettlementsRequestDTO, SettlementsResponseDTO, } from '../../application/dto/settlements.dto';
import { RefundRequestDTO, RefundResponseDTO, } from '../../application/dto/refund.dto';
import { VtexRecordRepository } from '../../infrastructure/repository/vtex-record.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentFlow, VtexStatus } from '../../infrastructure/enums/vtex.enum';
import { ResponseDTO } from '../../application/dto/api-response.dto';
import { VtexTransactionRepository } from '../../infrastructure/repository/vtex-transaction.repository';
import { CoreTransactionDto } from '../../infrastructure/dto/core-transaction.dto';
import { VtexRequestDto } from '../../application/dto/vtex-request.dto';
import { VtexTransactionDto } from '../../infrastructure/dto/vtex-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { sleep, validateCardNumber } from "../../utils/validation";


const config = require('../../config/index').ENV;

@Injectable()
export class VtexDefaultService {
    constructor(
        private walletApiClient: WalletApiClient,
        private recordRep: VtexRecordRepository,
        private transactionRep: VtexTransactionRepository,
        private readonly logger: Logger,
    ) {
    }

    async payment(
        paymentRequest: PaymentRequestDTO,
    ): Promise<PaymentResponseDto> {
        try {
            const validCard: boolean = validateCardNumber(paymentRequest.card.number);
            let pagoPendiente: boolean = false; //Para simulacion de pago asincrono

            //Simular Pago

            if (paymentRequest.card.number.includes('422222222222222')) {
                pagoPendiente = true;
            }

            const trxResult: CoreTransactionDto = {
                amount: paymentRequest.value,
                orderId: paymentRequest.orderId,
                authorizationCode: pagoPendiente ? null : validCard ? uuidv4() : null,
                id: validCard ? uuidv4() : null
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
                trxResult,
                PaymentFlow.PAYMENT,
            );

            const response: PaymentResponseDto = {
                acquirer: null,
                authorizationId: null,
                delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
                delayToAutoSettleAfterAntifraud:
                envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
                delayToCancel: envConfig.vtex.development.delayToCancel,
                nsu: vtexTransaction.transactionNumber,
                paymentId: paymentRequest.paymentId,
                status: pagoPendiente ? VtexStatus.UNDEFINED : trxResult.id ? VtexStatus.APPROVED : VtexStatus.DENIED,
                tid: vtexTransaction.transactionNumber,
                paymentUrl: paymentRequest.returnUrl,
                code: String(0),
                message: pagoPendiente ? 'PENDING' : trxResult.id ? 'OK' : 'DENIED',
            };

            await this.recordRep.createRecord(
                paymentRequest.paymentId,
                PaymentFlow.PAYMENT,
                paymentRequest,
                response,
            );

            if (pagoPendiente) {
                this.paymentConfirmation(paymentRequest.paymentId, paymentRequest.card.number).then(() => {
                    this.logger.log('Flujo asincrono ejecutado');
                });
            }

            return response;
        } catch (e) {
            await this.recordRep.createRecord(
                paymentRequest.paymentId,
                PaymentFlow.PAYMENT,
                paymentRequest,
                e,
            );
            throw e;
        }
    }

    async paymentConfirmation(paymentId: string, ccnumber: string): Promise<ResponseDTO<null>> { //Credit Card Number guardado para simulacion de
        // datos invalidos

        sleep(2000);
        const transaction: VtexTransactionDto =
            await this.transactionRep.getPayment(paymentId);

        const validCard: boolean = validateCardNumber(ccnumber);

        //Simular Pago
        const trxResult: CoreTransactionDto = {
            amount: transaction.amount,
            orderId: transaction.orderId,
            authorizationCode: validCard ? uuidv4() : null,
            id: transaction.coreId
        };
        //

        const response: PaymentResponseDto = {
            acquirer: null,
            authorizationId: null,
            delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
            delayToAutoSettleAfterAntifraud:
            envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
            delayToCancel: envConfig.vtex.development.delayToCancel,
            nsu: transaction.transactionNumber,
            paymentId: transaction.paymentId,
            status: trxResult.id ? VtexStatus.APPROVED : VtexStatus.DENIED,
            tid: transaction.transactionNumber,
            paymentUrl: transaction.callbackUrl,
            code: String(0),
            message: trxResult.authorizationCode ? 'OK' : 'DENIED',
        };

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

        await this.transactionRep.saveTransaction(
            vtexData,
            trxResult,
            PaymentFlow.CONFIRMATION,
        );

        await this.recordRep.createRecord(
            paymentId,
            PaymentFlow.CONFIRMATION,
            paymentId,
            null,
        );

        return {code: 0, message: `paymentId:${paymentId} confirmado OK.`};
    }

    async cancellation(
        cancellationRequest
            :
            CancellationRequestDTO,
    ):
        Promise<CancellationResponseDTO> {
        let response
            :
            CancellationResponseDTO;
        const transaction: VtexTransactionDto =
            await this.transactionRep.getPayment(cancellationRequest.paymentId);

        try {
            const cancellationResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.cancel(transaction.,
                cancellationRequest.authorizationId);

            //DUMMY
            // const resultTrx: CoreTransactionDto = {
            //   amount: 0,
            //   authorizationCode: 'AUTH-002',
            //   balance: 0,
            //   creditNoteId: '',
            //   date: new Date(),
            //   dni: '257969045',
            //   email: 'andjos27@gmail.com',
            //   id: 'CORE-002',
            //   orderId: 'ORDER-001',
            //   origin: '',
            //   transferId: '',
            //   type: 'PCE',
            // };
            // const cancellationResult: ResponseDTO<CoreTransactionDto> = {
            //   code: 0,
            //   data: resultTrx,
            //   message: 'OK',
            // };
            //FIN DUMMY

            const vtexData: VtexRequestDto = {
                orderId: resultTrx.orderId,
                transactionNumber: transaction.transactionNumber,
                paymentId: cancellationRequest.paymentId,
                requestId: cancellationRequest.requestId,
            };

            await this.transactionRep.saveTransaction(
                vtexData,
                resultTrx,
                PaymentFlow.CANCELLATION,
            );

            response = {
                paymentId: cancellationRequest.paymentId,
                cancellationId: String(cancellationResult.data.id),
                code: String(cancellationResult.code),
                message: cancellationResult.message,
                requestId: cancellationRequest.requestId,
            };
        } catch (e) {
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
            PaymentFlow.CANCELLATION,
            cancellationRequest,
            response,
        );
        return response;
    }

    async refund(refundReq
                     :
                     RefundRequestDTO
    ):
        Promise<RefundResponseDTO> {
        let response
            :
            RefundResponseDTO;

        try {
            //const transactionResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.refund(refundReq.paymentId);
            //DUMMY
            const resultTrx: CoreTransactionDto = {
                amount: refundReq.value,
                authorizationCode: 'AUTH-003',
                balance: 0,
                creditNoteId: '',
                date: new Date(),
                dni: '257969045',
                email: 'andjos27@gmail.com',
                id: 'CORE-003',
                orderId: 'ORDER-001',
                origin: '',
                transferId: '',
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
                paymentId: refundReq.paymentId,
                requestId: refundReq.requestId,
                settleId: refundReq.settleId,
                value: refundReq.value,
            };

            await this.transactionRep.saveTransaction(
                vtexData,
                resultTrx,
                PaymentFlow.REFUND,
            );

            response = {
                paymentId: refundReq.paymentId,
                refundId: String(transactionResult.data.id),
                value: refundReq.value,
                code: String(transactionResult.code),
                message: 'Sucessfully refunded',
                requestId: refundReq.requestId,
            };
        } catch (e) {
            response = {
                paymentId: refundReq.paymentId,
                refundId: null,
                code: 'ERR123',
                value: 0,
                message: 'Refund has failed due to an internal error',
                requestId: refundReq.requestId,
            };
        }

        await this.recordRep.createRecord(
            refundReq.paymentId,
            PaymentFlow.REFUND,
            refundReq,
            response,
        );
        return response;
    }

    async settlements(
        settlementReq
            :
            SettlementsRequestDTO,
    ):
        Promise<SettlementsResponseDTO> {
        let response
            :
            SettlementsResponseDTO;
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
                transferId: '',
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

            await this.transactionRep.saveTransaction(
                vtexData,
                resultTrx,
                PaymentFlow.SETTLEMENT,
            );

            response = {
                paymentId: settlementReq.paymentId,
                settleId: String(transactionResult.data.id),
                value: transactionResult.data.amount,
                code: String(transactionResult.code),
                message: 'Sucessfully settled',
                requestId: settlementReq.requestId,
            };
        } catch (e) {
            response = {
                paymentId: settlementReq.paymentId,
                settleId: null,
                code: 'cancel-manually',
                value: settlementReq.value,
                message: 'Cancellation should be done manually',
                requestId: settlementReq.requestId,
            };
        }

        await this.recordRep.createRecord(
            settlementReq.paymentId,
            PaymentFlow.SETTLEMENT,
            settlementReq,
            response,
        );
        return response;
    }

//
// async asyncPaymentResponse(paymentRequest: PaymentRequestDTO): Promise<void> {
//   try {
//     const validCard: boolean = validateCardNumber(paymentRequest.card.number);
//
//     //const paymentResult: ResponseDTO<CoreTransactionDto> = await this.walletApiClient.payment(paymentWalletReq,
//     // paymentRequest.merchantName);
//     //const resultTrx: CoreTransactionDto = paymentResult.data;
//
//     //DUMMY
//     const resultTrx: CoreTransactionDto = {
//       amount: -1500,
//       authorizationCode: 'AUTH-001',
//       balance: 0,
//       creditNoteId: '',
//       date: new Date(),
//       dni: '257969045',
//       email: 'andjos27@gmail.com',
//       id: 'CORE-001',
//       orderId: 'ORDER-001',
//       origin: '',
//       transferId: '',
//       type: 'PCE',
//     };
//     let paymentResult: ResponseDTO<CoreTransactionDto> = {
//       code: validCard ? 0 : 1,
//       data: resultTrx,
//       message: validCard ? 'OK' : 'INVALID CARD',
//     };
//     if (paymentRequest.card.number == '4222222222222224') {
//       //Credit Card que envia VTEX y supuestamente es Valida
//       paymentResult = { code: 0, data: resultTrx, message: 'OK' };
//     }
//     //FIN DUMMY
//
//     const response: PaymentResponseDto = {
//       acquirer: null, // paymentRequest.card.holder || 'VTEX',
//       authorizationId:
//         paymentResult.code == 0 ? resultTrx.authorizationCode : null,
//       delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
//       delayToAutoSettleAfterAntifraud:
//         envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
//       delayToCancel: envConfig.vtex.development.delayToCancel,
//       nsu: String(resultTrx.id),
//       paymentId: paymentRequest.paymentId,
//       status:
//         paymentResult.code == 0 ? VtexStatus.APPROVED : VtexStatus.DENIED,
//       tid: String(resultTrx.id),
//       paymentUrl: paymentRequest.returnUrl,
//       code: String(paymentResult.code),
//       message: paymentResult.message,
//     };
//
//     const vtexData: VtexRequestDto = {
//       orderId: paymentResult.code == 0 ? resultTrx.orderId : null,
//       paymentId: paymentRequest.paymentId,
//       value: paymentRequest.value,
//     };
//     await this.transactionRep.saveTransaction(
//       vtexData,
//       resultTrx,
//       PaymentFlow.ASYNC_RESPONSE,
//     );
//
//     await this.walletApiClient.callback(paymentRequest, response);
//
//     await this.recordRep.createRecord(
//       paymentRequest.paymentId,
//       PaymentFlow.ASYNC_RESPONSE,
//       paymentRequest,
//       response,
//     );
//
//     return;
//   } catch (e) {
//     await this.recordRep.createRecord(
//       paymentRequest.paymentId,
//       PaymentFlow.PAYMENT,
//       paymentRequest,
//       e,
//     );
//     throw e;
//   }
// }
}
