import { PaymentOperation } from '../enums/vtex.enum';

export class PaymentTransactionDto {
  id?: number;
  date?: Date;
  paymentId: string;
  operationType: PaymentOperation;
  amount: number;
  authorizationId?: string;
  settleId?: string;
  requestId?: string;
}
