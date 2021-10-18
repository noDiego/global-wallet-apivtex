export class TransactionDto {
  id?: string;
  authorizationCode: string;
  status?: string;
  type?: string;
  orderId: string;
  creditNoteId?: string;
  date?: Date;
  transferId?: string;
  amount: number;
  commerceClientId?: number;
  currency?: string;
  paymentId?: string;
}

export class GetFilterTransactionDto {
  dni?: string;
  email?: string;
  origin?: string;
  types?: string[];
  status?: string[];
}

export class GetAmountTransactionDto {
  dni: string;
  email: string;
  origin: string;
  amount: number;
}
