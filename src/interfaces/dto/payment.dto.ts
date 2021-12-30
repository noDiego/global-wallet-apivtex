import { PaymentStatus } from '../enums/vtex.enum';

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
  coreId?: string;
  date?: Date;
  status?: PaymentStatus;
}
