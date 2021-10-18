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
        await this.vtexRepository.createRecord(paymentRequest.paymentId, PaymentFlow.PAYMENT, paymentRequest);

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

        const result: ResponseDTO<CommerceClientDTO> = await this.walletApiClient.payment(paymentWalletReq, paymentRequest.merchantName);
        const commerceClient: CommerceClientDTO = result.data;

        return {
            acquirer: paymentRequest.card.holder || 'VTEX',
            authorizationId: result.data.transactions[0].authorizationCode,
            delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
            delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
            delayToCancel: envConfig.vtex.development.delayToCancel,
            nsu: result.data.transactions[0].id,
            paymentId: commerceClient.transactions[0].paymentId,
            status: commerceClient.transactions[0].status == TransactionStatus.INIT ? VtexStatus.UNDEFINED: VtexStatus.DENIED,
            tid: paymentRequest.transactionId,
            paymentUrl: paymentRequest.returnUrl,
            code:String(result.code),
            message:result.message
        };
    }

    async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {
        try {
            await this.vtexRepository.createRecord(cancellationRequest.paymentId, PaymentFlow.CANCELLATION, cancellationRequest);

            const response: ResponseDTO<TransactionDto> = await this.walletApiClient.cancel(cancellationRequest.paymentId);

            return {
                paymentId: response.data.paymentId,
                cancellationId: response.data.id,
                code: String(response.code),
                message: response.message,
                requestId: cancellationRequest.requestId
            };

        } catch (e) {
            return {
                paymentId: cancellationRequest.paymentId,
                cancellationId: null,
                code: 'cancel-manually',
                message: 'Cancellation should be done manually',
                requestId: cancellationRequest.requestId
            };
        }
    }

    async settlements(settlementReq: SettlementsRequestDTO): Promise<SettlementsResponseDTO> {
        try {
            await this.vtexRepository.createRecord(settlementReq.paymentId, PaymentFlow.SETTLEMENT, settlementReq);

            const transactionResult: TransactionDto = await this.walletApiClient.settlement(settlementReq.paymentId);

            return {
                paymentId: "F5C1A4E20D3B4E07B7E871F5B5BC9F91",
                settleId: "2EA354989E7E4BBC9F9D7B66674C2574",
                value: 57,
                code: null,
                message: "Sucessfully settled",
                requestId: "DCEAA1FC8372E430E8236649DB5EBD08E"
            };

        } catch (e) {
            return {
                paymentId: settlementReq.paymentId,
                settleId: null,
                code: 'cancel-manually',
                value: 0,
                message: 'Cancellation should be done manually',
                requestId: settlementReq.requestId
            };
        }

    }

    async refund(refundReq: RefundRequestDTO): Promise<RefundResponseDTO> {
        try {
            await this.vtexRepository.createRecord(refundReq.paymentId, PaymentFlow.REFUND, refundReq);

            // const transactionResult: TransactionDto = await this.walletApiClient.cancel(refundReq.paymentId);

            return {
                paymentId: refundReq.paymentId,
                refundId:"2EA354989E7E4BBC9F9D7B66674C2574",
                value:57,
                code:null,
                message:"Sucessfully refunded",
                requestId:"LA4E20D3B4E07B7E871F5B5BC9F91"
            };

        } catch (e) {
            return {
                paymentId: refundReq.paymentId,
                refundId: null,
                code: 'ERR123',
                value: 0,
                message: 'Refund has failed due to an internal error',
                requestId: refundReq.requestId
            };
        }

    }

    private getMerchantKey(merchantName: string){

    }

}
