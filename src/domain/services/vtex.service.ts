import { WalletApiClient } from "../../infrastructure/client/wallet-api.client";
import { Logger } from "winston";
import { PaymentRequestDTO } from "../../application/dto/payment-request.dto";
import { CreatePaymentReq } from "../../infrastructure/dto/createPaymentReq.dto";
import { CreateTransactionReq } from "../../infrastructure/dto/createTransactionReq.dto";
import { PaymentResponseDto } from "../../application/dto/payment-response.dto";
import { CommerceClientDTO } from "../../infrastructure/dto/commerceClient.dto";
import { VtexStatus } from "../../infrastructure/enums/vtex.enum";
import { envConfig } from "../../config";
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
            status: result.transactions[0].status == 'APPROVED' ? VtexStatus.APPROVED: VtexStatus.UNDEFINED, //TODO: Pendiente
            tid: paymentRequest.transactionId,
            paymentUrl: paymentRequest.returnUrl;
        };
    }

}
