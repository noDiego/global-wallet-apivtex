import { ClientDTO } from './client.dto';

export class CreateTransactionDetail {
  orderId: string;
  amount: number;
  paymentId: string;
  currency: string;
}

export class CreateTransactionReq {
  commerceUserId: string;
  client: ClientDTO;
  transaction: CreateTransactionDetail;
}
