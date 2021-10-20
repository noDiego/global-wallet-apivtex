import { CoreTransactionDto } from "./core-transaction.dto";

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

export class ClientDTO {
  id?: number;
  dni?: string;
  email?: string;
  commercesClients?: CommerceClientDTO[];
}

export class CommerceClientDTO {
  id?: number;
  origin?: string;
  commerceUserId?: string;
  client?: ClientDTO;
  transactions?: CoreTransactionDto[];
}
