export class CoreTransactionReq {
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
}

export class CoreTransactionRes {
  id: string;
  date: Date;
  amount: number;
  authorizationCode: string;
  status: string;
}

export enum TransactionStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CoreResponse {
  code: number; //0 ok; 1 error
  message: string;
  data?: CoreTransactionRes;
}
