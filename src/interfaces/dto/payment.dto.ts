import { PaymentStatus } from '../enums/vtex.enum';
import { WalletPaymentDto } from './wallet-payment.dto';

export class PaymentDto {
  id?: string;
  paymentId: string;
  amount: number;
  clientEmail?: string;
  merchantName?: string;
  commerceCode?: string;
  callbackUrl?: string;
  orderId?: string;
  authorizationId?: string;
  date?: Date;
  status?: PaymentStatus;
  walletPayments?: WalletPaymentDto[];
}
