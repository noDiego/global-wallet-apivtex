export class VtexTransactionDto {
  id?: number;
  paymentId: string;
  transactionNumber: string; //Identificador unico para Response de VTEX (NSU y TID)
  amount: number;
  clientEmail?: string;
  merchantName?: string;
  callbackUrl?: string;
  orderId?: string;
  tld?: string;
  authorizationId?: string;
  settletId?: string;
  coreId?: string;
  requestId?: string;
  date: Date;
}
