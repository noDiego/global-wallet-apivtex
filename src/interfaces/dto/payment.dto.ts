import { PaymentStatus } from '../enums/vtex.enum';
import { WalletPaymentDto } from './wallet-payment.dto';
import { CommerceDto } from './commerce.dto';

export class PaymentDto {
  id?: string;
  paymentId: string;
  amount: number;
  clientEmail?: string;
  merchantName?: string;
  commerce?: CommerceDto;
  callbackUrl?: string;
  orderId?: string;
  reference?: string;
  date?: Date;
  status?: PaymentStatus;
  walletPayments?: WalletPaymentDto[];
}
