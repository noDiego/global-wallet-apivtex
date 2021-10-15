import { WalletApiClient } from "../../infrastructure/client/wallet-api.client";
import { Logger } from "winston";
import { PaymentRequestDTO } from "../../application/dto/payment-request.dto";
import { CreateTransactionReq } from "../../infrastructure/dto/createTransactionReq.dto";
import { PaymentResponseDto } from "../../application/dto/payment-response.dto";
import { CommerceClientDTO } from "../../infrastructure/dto/commerceClient.dto";
import { TransactionStatus, VtexStatus } from "../../infrastructure/enums/vtex.enum";
import { envConfig } from "../../config";
import { TransactionDto } from "src/infrastructure/dto/transaction.dto";
import { CancellationRequestDTO, CancellationResponseDTO } from "src/application/dto/cancellation.dto";
import { SettlementsRequestDTO, SettlementsResponseDTO } from "../../application/dto/settlements.dto";
import { RefundRequestDTO, RefundResponseDTO } from "../../application/dto/refund.dto";

const config = require('../../config/index').ENV;

export class VtexService {

    constructor(
        private walletApiClient: WalletApiClient,
        private readonly logger: Logger,
    ) {
    }


    async payment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDto> {
        const origin = paymentRequest.merchantName; //TODO: Revisar

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

        const result: CommerceClientDTO = await this.walletApiClient.payment(paymentWalletReq, origin);

        return {
            acquirer: null,
            authorizationId: null,
            delayToAutoSettle: envConfig.vtex.development.delayToAutoSettle,
            delayToAutoSettleAfterAntifraud: envConfig.vtex.development.delayToAutoSettleAfterAntifraud,
            delayToCancel: envConfig.vtex.development.delayToCancel,
            nsu: null,//TODO
            paymentId: "",
            status: result.transactions[0].status == TransactionStatus.APPROVED ? VtexStatus.APPROVED : VtexStatus.UNDEFINED,
            tid: paymentRequest.transactionId,
            paymentUrl: paymentRequest.returnUrl
        };
    }

    async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {
        try {
            const transactionResult: TransactionDto = await this.walletApiClient.cancel(cancellationRequest.paymentId);

            return {
                paymentId: transactionResult.paymentId,
                cancellationId: transactionResult.id,
                code: 'string',
                message: 'Sucessfully cancelled',
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


            const transactionResult: TransactionDto = await this.walletApiClient.cancel(refundReq.paymentId);

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

}
