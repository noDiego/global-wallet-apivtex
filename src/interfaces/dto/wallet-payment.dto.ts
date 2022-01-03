import { PaymentOperation } from '../enums/vtex.enum';

export class WalletPaymentDto {
  coreId: string;
  date?: Date;
  paymentId: string;
  amount: number;
  operationType: PaymentOperation;
}
