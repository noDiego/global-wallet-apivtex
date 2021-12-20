export class CoreTransactionDto {
  id?: string;
  type?: string;
  orderId: string;
  creditNoteId?: string;
  date?: Date;
  amount: number;
  origin?: string;
  dni?: string;
  email?: string;
  authorizationCode?: string;
  balance?: number;
  parentRef?: string;
}
