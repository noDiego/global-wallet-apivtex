import { WalletApiClient } from "../../infrastructure/client/wallet-api.client";
import { Logger } from "winston";
import { PaymentRequestDTO } from "../../application/dto/payment-request.dto";
import { CreatePaymentReq } from "../../infrastructure/dto/createPaymentReq.dto";
import { CreateTransactionReq } from "../../infrastructure/dto/createTransactionReq.dto";
import { PaymentResponseDto } from "../../application/dto/payment-response.dto";
import { CommerceClientDTO } from "../../infrastructure/dto/commerceClient.dto";
import { VtexStatus, TransactionStatus } from "../../infrastructure/enums/vtex.enum";
import { envConfig } from "../../config";
import { TransactionDto } from "src/infrastructure/dto/transaction.dto";
import { CancellationResponseDTO, CancellationRequestDTO } from "src/application/dto/cancellation.dto";
const config = require('../../config/index').ENV;

export class VtexService{

    constructor(
        private walletApiClient: WalletApiClient,
        private readonly logger: Logger,
    ) {}


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
            nsu: paymentRequest.,
            paymentId: "",
            status: result.transactions[0].status == TransactionStatus.APPROVED ? VtexStatus.APPROVED: VtexStatus.UNDEFINED,
            tid: paymentRequest.transactionId,
            paymentUrl: paymentRequest.returnUrl
        };
    }

    async cancellation(cancellationRequest: CancellationRequestDTO): Promise<CancellationResponseDTO> {
        try{
            const transactionResult: TransactionDto = await this.walletApiClient.cancel(cancellationRequest.paymentId);

            return {
                paymentId: transactionResult.paymentId,
                cancellationId: transactionResult.id,
                code: 'string',
                message: 'Sucessfully cancelled',
                requestId: cancellationRequest.requestId
            };

        }catch (e) {
            return {
                paymentId: cancellationRequest.paymentId,
                cancellationId: null,
                code: 'cancel-manually',
                message: 'Cancellation should be done manually',
                requestId: cancellationRequest.requestId
            };
        }
       
    }

}
