import { PaymentStatus } from '../enums/vtex.enum';

export interface UpdatePaymentDto {
  paymentId: string;
  status?: PaymentStatus;
  coreId?: string;
  amount?: number;
  commerceId?: number;
}
