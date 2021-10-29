import { IsNumber, IsPositive, Max, Min } from 'class-validator';

export class PaymentRequestDTO {
  reference: string;
  orderId: string;
  shopperInteraction: string;
  transactionId: string;
  paymentId: string;
  paymentMethod: string;
  merchantName: string;
  card: Card;
  @IsNumber()
  @IsPositive()
  value: number;
  currency: string;
  installments: number;
  installmentsInterestRate: number;
  installmentsValue: number;
  deviceFingerprint: string;
  ipAddress: string;
  miniCart: MiniCart;
  url: string;
  callbackUrl: string;
  returnUrl: string;
  inboundRequestsUrl: string;
  recipients: Recipient[];
  merchantSettings: MerchantSetting[];
}

export interface Expiration {
  month: string;
  year: string;
}

export interface Card {
  holder: string;
  number: string;
  csc: string;
  expiration: Expiration;
  document: string;
  token?: any;
}

export interface Buyer {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  documentType: string;
  corporateName?: any;
  tradeName?: any;
  corporateDocument?: any;
  isCorporate: boolean;
  email: string;
  phone: string;
  createdDate: Date;
}

export interface ShippingAddress {
  country: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
}

export interface BillingAddress {
  country: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  deliveryType: string;
  categoryId: string;
  sellerId: string;
}

export interface MiniCart {
  buyer: Buyer;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  items: Item[];
  shippingValue: number;
  taxValue: number;
}

export interface Recipient {
  id: string;
  name: string;
  documentType: string;
  document: string;
  role: string;
  chargeProcessingFee?: boolean;
  chargebackLiable?: boolean;
  amount: number;
}

export interface MerchantSetting {
  name: string;
  value: string;
}
