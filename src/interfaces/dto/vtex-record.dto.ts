import { PaymentOperation } from '../enums/vtex.enum';

export class VtexRecordDto {
  paymentId: string;
  operationType: PaymentOperation;
  requestData?: any;
  responseData?: any;
}
