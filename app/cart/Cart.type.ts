export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  originalPrice: string;
  finalPrice: string;
  discountAmount?: number;
  discountLabel?: string;
  imageUrl: string;
  imageAlt: string;
}

export interface Promotion {
  name: string;
  savedAmount: string;
  isShipping: boolean;
}

export interface CartSummaryData {
  subtotal: string;
  shipping: string;
  tax: string;
  discountTotal: string;
  total: string;
  hasSavings: boolean;
  totalSavings: string;
  isFreeShipping: boolean;
  promotions?: Promotion[];
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  shippingNotes: string;
}

export interface PaymentMethod {
  type: string;
  cardNumber: string;
  expiration: string;
}

export interface ShippingMethod {
  name: string;
  status: string;
  estimatedDeliveryDate: string;
}

export interface CartResponse extends Record<string, unknown> {
  orderNumber: string;
  items: CartItem[];
  summary: CartSummaryData;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
}

