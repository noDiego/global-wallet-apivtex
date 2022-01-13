export enum PaymentStatus {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  INIT = 'INIT',
  CANCELED = 'CANCELED',
  SETTLED = 'SETTLED',
}

export enum VtexStatus {
  APPROVED = 'approved',
  DENIED = 'denied',
  UNDEFINED = 'undefined',
}

export enum PaymentOperation {
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation',
  CANCELLATION = 'cancellation',
  SETTLEMENT = 'settlement',
  REFUND = 'refund',
  UPSELLING = 'upselling',
}

export enum MerchantKeys {
  PARIS = '97faafabdf7d9212ef57df5db35802bc232f918f0d956021d85eb7229fcd86a440c9b997fb0e1c7f485466212c3dc153023b657f6376',
  JUMBO = '97faafabdf7d9212ef57df5db35802bc232f918f0d956021d85eb7229fcd86a440c9b997fb0e1c7f485466212c32c74e01262e71',
  SISA = '97faa2a5c776c45ab43fb032b25b02bc23229f9706c3287aa92dc620f1c388e54cc2b8d0e3165b6f535f6a353636d14c07206b636376',
  //TEST
  jumbocltest = '97faafabdf7d9212ef57df5db35802bc232f918f0d956021d85eb7229fcd86a440c9b997fb0e1c7f485466212c32c74e01262e71',
  jumboprepro = '97faafabdf7d9212ef57df5db35802bc232f918f0d956021d85eb7229fcd86a440c9b997fb0e1c7f485466212c32c74e01262e71',
}

export function getVtexStatus(paymentStatus: PaymentStatus): VtexStatus {
  switch (paymentStatus) {
    case PaymentStatus.APPROVED:
      return VtexStatus.APPROVED;
    case PaymentStatus.DENIED:
      return VtexStatus.DENIED;
    default:
      return VtexStatus.UNDEFINED;
  }
}
