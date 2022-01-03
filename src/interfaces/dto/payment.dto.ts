import { PaymentStatus } from '../enums/vtex.enum';
import { WalletPaymentDto } from './wallet-payment.dto';

export class PaymentDto {
  id?: number; //Identificador unico para Response de VTEX (NSU y TID)
  paymentId: string;
  amount: number;
  clientEmail?: string;
  merchantName?: string;
  callbackUrl?: string;
  orderId?: string;
  tld?: string;
  authorizationId?: string;
  date?: Date;
  status?: PaymentStatus;
  walletPayments?: WalletPaymentDto[];
}
