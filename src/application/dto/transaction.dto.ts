export class TransactionDto {
  id?: number;
  status?: string;
  type?: string;
  orderId: string;
  creditNoteId?: string;
  date?: Date;
  transferId?: string;
  amount: number;
  origin?: string;
  dni?: string;
  email?: string;
  paymentId?: string;
  authorizationCode?: string;
  balance?: number;
}
