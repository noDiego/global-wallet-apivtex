export class CoreTransactionDto {
  id?: number|string;
  type?: string;
  orderId: string;
  creditNoteId?: string;
  date?: Date;
  transferId?: string;
  amount: number;
  origin?: string;
  dni?: string;
  email?: string;
  authorizationCode?: string;
  balance?: number;
}
