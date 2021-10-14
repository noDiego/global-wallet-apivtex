import { ClientDTO } from './client.dto';

export class CreatePaymentDetail {
  orderId: string;
  amount: number;
  creditNoteId?: string;
}

export class CreatePaymentReq {
  commerceUserId: string;
  origin: string;
  client: ClientDTO;
  transaction: CreatePaymentDetail;
}
