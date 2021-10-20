export class VtexTransactionDto {
    id?: number;
    paymentId: string;
    amount: number;
    orderId?: string;
    tld?: string;
    authorizationId?: string;
    settletId?: string;
    requestId?: string;
    date: Date;
}
