import { Recipient } from "./payment-request.dto";

export interface SettlementsRequestDTO {
    transactionId: string;
    requestId: string;
    paymentId: string;
    tid: string;
    value: number;
    authorizationId: string;
    recipients?: Recipient[];
    settleId?: string; //TODO: Confirmar si realmente VTEX lo envia, y si se usa
    sandboxMode?: boolean;

}

export interface SettlementsResponseDTO {
    paymentId: string;
    settleId?: string;
    value: number;
    code?: string;
    message?: string;
    requestId: string;
}
