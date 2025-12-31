export interface OrderItem {
  variationCode: string;
  name: string;
  quantity: number;
  listPriceFormatted: string;
  subTotalFormatted: string;
  discountAmount?: number;
  discountAmountFormatted?: string;
  imageViewModel: {
    imageUrl: string;
  };
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  regionCode: string;
  postalCode: string;
  daytimePhoneNumber: string;
  email: string;
  deliveryNotes: string;
}

export interface PaymentMethod {
  cardTypeDisplayName: string;
  cardNumber: string;
  expirationDateFormatted: string;
}

export interface OrderData {
  orderNumber: string;
  orderDateFormatted: string;
  lineItems: OrderItem[];
  subTotalFormatted: string;
  shippingTotalFormatted: string;
  taxTotalFormatted: string;
  discountTotalFormatted: string;
  totalFormatted: string;
  totalSavingsFormatted: string;
  shippingAddress: ShippingAddress;
  firstPaymentInformation: PaymentMethod;
  shippingMethodName: string;
  status: string;
  estimatedDeliveryDate: string | null;
}

export interface OrderConfirmationProps extends Record<string, unknown> {
  order: OrderData;
}
