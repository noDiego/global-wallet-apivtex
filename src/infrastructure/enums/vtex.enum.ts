export enum TransactionStatus {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    INIT = 'INIT',
    CANCELED = 'CANCELED',
}

export enum VtexStatus {
    APPROVED = 'approved',
    DENIED = 'denied',
    UNDEFINED = 'undefined',
}


export enum PaymentFlow {
    PAYMENT = 'payment',
    ASYNC_RESPONSE = 'async-response',
    CANCELLATION = 'cancellation',
    SETTLEMENT = 'settlement',
    REFUND = 'refund',
}



export enum MerchantKeys {
    PARIS = '97faafabdf7d9212ef4ec343b0350cb262238b9417936b7ac046d62df1c388e54cc2b8d0e3165b6f535f6a353636d14c07206b636376',
    JUMBO = '97faafabdf7d9212ef57df5db35802bc232f918f0d956021d85eb7229fcd86a440c9b997fb0e1c7954446023302ddc400c2d656b2e2922',
    SISA = '97faa2a5c776c45ab43fb032b25b02bc23229f9706c3287aa92dc620f1c388e54cc2b8d0e3165b6f535f6a353636d14c07206b636376',
}
