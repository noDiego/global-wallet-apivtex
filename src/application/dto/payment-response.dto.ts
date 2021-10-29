export class PaymentResponseDto {
  paymentId: string;
  status: string;
  authorizationId: string;
  nsu: string;
  tid: string;
  acquirer: string;
  delayToAutoSettle: number;
  delayToAutoSettleAfterAntifraud: number;
  delayToCancel: number;
  paymentUrl?: string;
  paymentAppData?: PaymentAppData;
  identificationNumber?: string;
  identificationNumberFormatted?: string;
  barCodeImageType?: string;
  barCodeImageNumber?: string;
  code?: string;
  message?: string;
  maxValue?: number;
}

export class PaymentAppData {
  appName: string;
  payload: string;
}
