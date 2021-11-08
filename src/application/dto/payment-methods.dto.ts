export class PaymentMethodsDto {
  paymentMethods: string[];
}

export interface PaymentMethod {
  name: string;
  allowsSplit: string;
}

export interface Option {
  text?: string;
  value?: string;
}

export interface CustomField {
  name: string;
  type: string;
  options?: Option[];
}

export interface ManifestDTO {
  paymentMethods: PaymentMethod[];
  customFields: CustomField[];
}
