export class VtexTransactionDto {
  id?: number;
  paymentId: string;
  amount: number;
  clientEmail?: string;
  merchantName?: string;
  callbackUrl?: string;
  orderId?: string;
  tld?: string;
  authorizationId?: string;
  settletId?: string;
  requestId?: string;
  date: Date;
}
