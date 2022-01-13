import { PaymentStatus } from '../enums/vtex.enum';

export class VtexTransactionHistoryDto {
  id?: number;
  paymentId: string;
  amount: number;
  authorizationId?: string;
  settletId?: string;
  coreId?: string;
  requestId?: string;
  date: Date;
  status: PaymentStatus;
}
