export class TransactionDto {
  id?: number;
  status?: string;
  type?: string;
  orderId: string;
  creditNoteId?: string;
  date?: Date;
  transferId?: string;
  amount: number;
  commerceClientId?: number;
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
