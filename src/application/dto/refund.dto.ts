import { Recipient } from "./payment-request.dto";

export interface RefundRequestDTO {
    requestId: string;
    settleId: string;
    paymentId: string;
    value: number;
    transactionId: string;
    recipients: Recipient;
    tid: string;
    sandboxMode?: boolean;
}

export interface RefundResponseDTO {
    paymentId: string;
    refundId?: string;
    value: number;
    code?: string;
    message?: string;
    requestId: string;
}
