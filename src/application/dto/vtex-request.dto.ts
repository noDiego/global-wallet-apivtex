export class VtexRequestDto {
  paymentId: string;
  transactionNumber?: string;
  merchantName?: string;
  clientEmail?: string;
  requestId?: string;
  settleId?: string;
  orderId?: string;
  value?: number;
  callbackUrl?: string;
}
