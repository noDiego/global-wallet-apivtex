import { WalletApiClient } from "../../infrastructure/client/wallet-api.client";
import { PaymentRequestDTO } from "../../application/dto/payment-request.dto";
import { CreateTransactionReq } from "../../infrastructure/dto/createTransactionReq.dto";
import { PaymentResponseDto } from "../../application/dto/payment-response.dto";
import { envConfig } from "../../config";
import { TransactionDto } from "src/infrastructure/dto/transaction.dto";
import { CancellationRequestDTO, CancellationResponseDTO } from "src/application/dto/cancellation.dto";
import { SettlementsRequestDTO, SettlementsResponseDTO } from "../../application/dto/settlements.dto";
import { RefundRequestDTO, RefundResponseDTO } from "../../application/dto/refund.dto";
import { VtexRecordRepository } from "../../infrastructure/repository/vtex-record.repository";
import { Injectable, Logger } from "@nestjs/common";
import { PaymentFlow, TransactionStatus, VtexStatus } from "../../infrastructure/enums/vtex.enum";
import { CommerceClientDTO } from "../../infrastructure/dto/commerceClient.dto";
import { ResponseDTO } from "../../application/dto/api-response.dto";

const config = require('../../config/index').ENV;

@Injectable()
export class VtexService {

    constructor(
        private walletApiClient: WalletApiClient,
        private vtexRepository: VtexRecordRepository,
        private readonly logger: Logger,
    ) {
    }


    async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
        let response: PaymentResponseDto;

        const paymentWalletReq: CreateTransactionReq = {
            client: {
                email: paymentRequest.miniCart.buyer.email
            },
            commerceUserId: paymentRequest.miniCart.buyer.id,
            transaction: {
                orderId: paymentRequest.orderId,
                amount: paymentRequest.value,
                paymentId: paymentRequest.paymentId,
                currency: paymentRequest.currency,
            }

        }
        try {
            const paymentResult: ResponseDTO<TransactionDto> = await this.walletApiClient.payment(paymentWalletReq, paymentRequest.merchantName);
            const transaction: TransactionDto = paymentResult.data;
            response = {
                acquirer: null,// paymentRequest.card.holder || 'VTEX',
                authorizationId: transaction.authorizationCode,
                delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
                delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
                delayToCancel: envConfig.vtex.development.delayToCancel,
                nsu: transaction.id,
                paymentId: transaction.paymentId,
                status: transaction.status == TransactionStatus.APPROVED ? VtexStatus.APPROVED : VtexStatus.UNDEFINED,
                tid: transaction.id,
                paymentUrl: paymentRequest.returnUrl,
                code: String(paymentResult.code),
                message: paymentResult.message
            };
        } catch (e) {
            await this.vtexRepository.createRecord(paymentRequest.paymentId, PaymentFlow.PAYMENT, paymentRequest, e);
            throw e;
        }

        await this.vtexRepository.createRecord(paymentRequest.paymentId, PaymentFlow.PAYMENT, paymentRequest, response);
        return response;
    }

    async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {

        let response: CancellationResponseDTO;

        try {
            const cancellationResult: ResponseDTO<TransactionDto> = await this.walletApiClient.cancel(cancellationRequest.paymentId, cancellationRequest.authorizationId);

            response = {
                paymentId: cancellationResult.data.paymentId,
                cancellationId: cancellationResult.data.id,
                code: String(cancellationResult.code),
                message: cancellationResult.message,
                requestId: cancellationRequest.requestId
            };

        } catch (e) {
            response = {
                paymentId: cancellationRequest.paymentId,
                cancellationId: null,
                code: 'cancel-manually',
                message: 'Cancellation should be done manually',
                requestId: cancellationRequest.requestId
            };
        }
        await this.vtexRepository.createRecord(cancellationRequest.paymentId, PaymentFlow.CANCELLATION, cancellationRequest, response);
        return response;

    }

    async settlements(settlementReq: SettlementsRequestDTO): Promise<SettlementsResponseDTO> {
        let response: SettlementsResponseDTO;
        try {
            const transactionResult: ResponseDTO<TransactionDto> = await this.walletApiClient.settlement(settlementReq.paymentId);
            response = {
                paymentId: transactionResult.data.paymentId,
                settleId: transactionResult.data.id,
                value: transactionResult.data.amount,
                code: String(transactionResult.code),
                message: "Sucessfully settled",
                requestId: settlementReq.requestId
            };

        } catch (e) {
            response = {
                paymentId: settlementReq.paymentId,
                settleId: null,
                code: 'cancel-manually',
                value: settlementReq.value,
                message: 'Cancellation should be done manually',
                requestId: settlementReq.requestId
            };
        }

        await this.vtexRepository.createRecord(settlementReq.paymentId, PaymentFlow.SETTLEMENT, settlementReq, response);
        return response;

    }

    async refund(refundReq: RefundRequestDTO): Promise<RefundResponseDTO> {

        let response: RefundResponseDTO;

        try {
            const transactionResult: ResponseDTO<TransactionDto> = await this.walletApiClient.refund(refundReq.paymentId);
            response = {
                paymentId: transactionResult.data.paymentId,
                refundId: transactionResult.data.id,
                value: refundReq.value,
                code: String(transactionResult.code),
                message: "Sucessfully refunded",
                requestId: "LA4E20D3B4E07B7E871F5B5BC9F91"
            };

        } catch (e) {
            response = {
                paymentId: refundReq.paymentId,
                refundId: null,
                code: 'ERR123',
                value: 0,
                message: 'Refund has failed due to an internal error',
                requestId: refundReq.requestId
            };
        }

        await this.vtexRepository.createRecord(refundReq.paymentId, PaymentFlow.REFUND, refundReq, response);
        return response;

    }

}
